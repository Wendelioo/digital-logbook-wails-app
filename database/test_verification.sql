-- ============================================================================
-- VERIFICATION AND TESTING SCRIPT
-- Description: Verify the new enrollment system structure and test functionality
-- Date: 2025-10-14
-- ============================================================================

USE logbookdb;

-- ============================================================================
-- SECTION 1: STRUCTURE VERIFICATION
-- ============================================================================

SELECT '=== DATABASE STRUCTURE VERIFICATION ===' AS '';

-- Check if all new tables exist
SELECT 'Tables Check' AS Test,
    CASE
        WHEN COUNT(*) = 5 THEN 'PASS ✓'
        ELSE CONCAT('FAIL ✗ (Found ', COUNT(*), ' tables, expected 5)')
    END AS Result
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'logbookdb'
AND TABLE_NAME IN ('subjects', 'classes', 'classlist', 'attendance', 'teachers');

-- Check if all views exist
SELECT 'Views Check' AS Test,
    CASE
        WHEN COUNT(*) >= 4 THEN 'PASS ✓'
        ELSE CONCAT('FAIL ✗ (Found ', COUNT(*), ' views, expected at least 4)')
    END AS Result
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'logbookdb'
AND TABLE_NAME IN ('v_classes_complete', 'v_classlist_complete', 'v_teacher_classes', 'v_attendance_complete');

-- Check foreign key constraints
SELECT 'Foreign Keys Check' AS Test,
    CASE
        WHEN COUNT(*) >= 6 THEN 'PASS ✓'
        ELSE CONCAT('FAIL ✗ (Found ', COUNT(*), ' foreign keys, expected at least 6)')
    END AS Result
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'logbookdb'
AND REFERENCED_TABLE_NAME IS NOT NULL
AND TABLE_NAME IN ('subjects', 'classes', 'classlist', 'attendance');

-- ============================================================================
-- SECTION 2: DATA INTEGRITY VERIFICATION
-- ============================================================================

SELECT '=== DATA INTEGRITY VERIFICATION ===' AS '';

-- Check subject count
SELECT 'Subjects Count' AS Test,
    CASE
        WHEN COUNT(*) > 0 THEN CONCAT('PASS ✓ (', COUNT(*), ' subjects found)')
        ELSE 'WARNING ⚠ (No subjects found - may need to run migration_data.sql)'
    END AS Result
FROM subjects;

-- Check classes count
SELECT 'Classes Count' AS Test,
    CASE
        WHEN COUNT(*) > 0 THEN CONCAT('PASS ✓ (', COUNT(*), ' classes found)')
        ELSE 'WARNING ⚠ (No classes found - may need to run migration_data.sql)'
    END AS Result
FROM classes;

-- Check all subjects have valid teachers
SELECT 'Subject-Teacher Links' AS Test,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS ✓ (All subjects have valid teachers)'
        ELSE CONCAT('FAIL ✗ (', COUNT(*), ' subjects have invalid teacher_id)')
    END AS Result
FROM subjects s
LEFT JOIN teachers t ON s.teacher_id = t.id
WHERE t.id IS NULL;

-- Check all classes have valid subjects and teachers
SELECT 'Class-Subject-Teacher Links' AS Test,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS ✓ (All classes have valid subjects and teachers)'
        ELSE CONCAT('FAIL ✗ (', COUNT(*), ' classes have invalid links)')
    END AS Result
FROM classes c
LEFT JOIN subjects s ON c.subject_id = s.id
LEFT JOIN teachers t ON c.teacher_id = t.id
WHERE s.id IS NULL OR t.id IS NULL;

-- Check all classlist entries have valid classes and students
SELECT 'Classlist Integrity' AS Test,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS ✓ (All enrollments are valid)'
        ELSE CONCAT('FAIL ✗ (', COUNT(*), ' enrollments have invalid references)')
    END AS Result
FROM classlist cl
LEFT JOIN classes c ON cl.class_id = c.id
LEFT JOIN users u ON cl.student_id = u.id
WHERE c.id IS NULL OR u.id IS NULL;

-- Check all attendance records have valid classlist entries
SELECT 'Attendance Integrity' AS Test,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS ✓ (All attendance records are valid)'
        ELSE CONCAT('FAIL ✗ (', COUNT(*), ' attendance records have invalid classlist_id)')
    END AS Result
FROM attendance a
LEFT JOIN classlist cl ON a.classlist_id = cl.id
WHERE cl.id IS NULL;

-- ============================================================================
-- SECTION 3: SAMPLE DATA QUERIES
-- ============================================================================

SELECT '=== SAMPLE DATA QUERIES ===' AS '';

-- List all subjects with teachers
SELECT 
    '--- Subjects with Teachers ---' AS '';
SELECT 
    s.subject_code AS 'Code',
    s.subject_name AS 'Subject',
    CONCAT(t.first_name, ' ', t.last_name) AS 'Teacher'
FROM subjects s
JOIN teachers t ON s.teacher_id = t.id
ORDER BY s.subject_code
LIMIT 10;

-- List all classes with enrollment counts
SELECT 
    '--- Classes with Enrollment Counts ---' AS '';
SELECT 
    vc.subject_code AS 'Subject',
    vc.year_level AS 'Year',
    vc.section AS 'Section',
    vc.teacher_name AS 'Teacher',
    vc.enrolled_count AS 'Enrolled',
    vc.is_active AS 'Active'
FROM v_teacher_classes vc
ORDER BY vc.subject_code, vc.year_level, vc.section
LIMIT 10;

-- List sample enrollments
SELECT 
    '--- Sample Student Enrollments ---' AS '';
SELECT 
    vcl.student_code AS 'Student ID',
    CONCAT(vcl.last_name, ', ', vcl.first_name) AS 'Name',
    vc.subject_code AS 'Subject',
    vc.section AS 'Section',
    vcl.enrollment_status AS 'Status'
FROM v_classlist_complete vcl
JOIN v_classes_complete vc ON vcl.class_id = vc.class_id
WHERE vcl.enrollment_status = 'active'
ORDER BY vcl.last_name, vcl.first_name
LIMIT 10;

-- ============================================================================
-- SECTION 4: FUNCTIONAL TESTS
-- ============================================================================

SELECT '=== FUNCTIONAL TESTS ===' AS '';

-- Test: Create a test subject (will be rolled back)
START TRANSACTION;

-- Check if we can create a subject
INSERT INTO subjects (subject_code, subject_name, teacher_id, description)
SELECT 'TEST101', 'Test Subject', id, 'This is a test subject'
FROM teachers LIMIT 1;

SELECT 
    'Create Subject Test' AS Test,
    CASE 
        WHEN ROW_COUNT() > 0 THEN 'PASS ✓ (Subject creation works)'
        ELSE 'FAIL ✗ (Cannot create subject)'
    END AS Result;

-- Store the test subject ID
SET @test_subject_id = LAST_INSERT_ID();

-- Test: Create a test class
INSERT INTO classes (subject_id, teacher_id, schedule, room, year_level, section, semester, school_year, is_active)
SELECT @test_subject_id, id, 'Test Schedule', 'Test Room', 'Test Year', 'Test', '1st Sem', '2024-2025', TRUE
FROM teachers LIMIT 1;

SELECT 
    'Create Class Test' AS Test,
    CASE 
        WHEN ROW_COUNT() > 0 THEN 'PASS ✓ (Class creation works)'
        ELSE 'FAIL ✗ (Cannot create class)'
    END AS Result;

-- Store the test class ID
SET @test_class_id = LAST_INSERT_ID();

-- Test: Enroll a student
INSERT INTO classlist (class_id, student_id, status)
SELECT @test_class_id, user_id, 'active'
FROM students LIMIT 1;

SELECT 
    'Enroll Student Test' AS Test,
    CASE 
        WHEN ROW_COUNT() > 0 THEN 'PASS ✓ (Student enrollment works)'
        ELSE 'FAIL ✗ (Cannot enroll student)'
    END AS Result;

-- Store the test classlist ID
SET @test_classlist_id = LAST_INSERT_ID();

-- Test: Record attendance
INSERT INTO attendance (classlist_id, date, status)
VALUES (@test_classlist_id, CURDATE(), 'present');

SELECT 
    'Record Attendance Test' AS Test,
    CASE 
        WHEN ROW_COUNT() > 0 THEN 'PASS ✓ (Attendance recording works)'
        ELSE 'FAIL ✗ (Cannot record attendance)'
    END AS Result;

-- Rollback test data
ROLLBACK;

SELECT 'Test Cleanup' AS Test, 'PASS ✓ (Test data rolled back)' AS Result;

-- ============================================================================
-- SECTION 5: VIEW TESTS
-- ============================================================================

SELECT '=== VIEW TESTS ===' AS '';

-- Test v_classes_complete view
SELECT 
    'v_classes_complete View' AS Test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS ✓ (View is accessible)'
        ELSE 'FAIL ✗ (View error)'
    END AS Result
FROM v_classes_complete
LIMIT 1;

-- Test v_classlist_complete view
SELECT 
    'v_classlist_complete View' AS Test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS ✓ (View is accessible)'
        ELSE 'FAIL ✗ (View error)'
    END AS Result
FROM v_classlist_complete
LIMIT 1;

-- Test v_teacher_classes view
SELECT 
    'v_teacher_classes View' AS Test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS ✓ (View is accessible)'
        ELSE 'FAIL ✗ (View error)'
    END AS Result
FROM v_teacher_classes
LIMIT 1;

-- Test v_attendance_complete view
SELECT 
    'v_attendance_complete View' AS Test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS ✓ (View is accessible)'
        ELSE 'FAIL ✗ (View error)'
    END AS Result
FROM v_attendance_complete
LIMIT 1;

-- ============================================================================
-- SECTION 6: PERFORMANCE TESTS
-- ============================================================================

SELECT '=== PERFORMANCE TESTS ===' AS '';

-- Test index on subjects.teacher_id
SELECT 
    'subjects.teacher_id Index' AS Test,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS ✓ (Index exists)'
        ELSE 'WARNING ⚠ (No index found)'
    END AS Result
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'logbookdb'
AND TABLE_NAME = 'subjects'
AND COLUMN_NAME = 'teacher_id';

-- Test index on classes.teacher_id
SELECT 
    'classes.teacher_id Index' AS Test,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS ✓ (Index exists)'
        ELSE 'WARNING ⚠ (No index found)'
    END AS Result
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'logbookdb'
AND TABLE_NAME = 'classes'
AND COLUMN_NAME = 'teacher_id';

-- Test unique constraint on classlist
SELECT 
    'classlist Unique Constraint' AS Test,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS ✓ (Unique constraint exists)'
        ELSE 'WARNING ⚠ (No unique constraint found)'
    END AS Result
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'logbookdb'
AND TABLE_NAME = 'classlist'
AND CONSTRAINT_TYPE = 'UNIQUE';

-- ============================================================================
-- SECTION 7: SUMMARY STATISTICS
-- ============================================================================

SELECT '=== SUMMARY STATISTICS ===' AS '';

SELECT 
    'Total Subjects' AS Metric,
    COUNT(*) AS Value,
    'Active courses in the system' AS Description
FROM subjects;

SELECT 
    'Total Classes' AS Metric,
    COUNT(*) AS Value,
    'Class instances across all subjects' AS Description
FROM classes;

SELECT 
    'Active Classes' AS Metric,
    COUNT(*) AS Value,
    'Currently active class instances' AS Description
FROM classes WHERE is_active = TRUE;

SELECT 
    'Total Enrollments' AS Metric,
    COUNT(*) AS Value,
    'Student enrollments across all classes' AS Description
FROM classlist WHERE status = 'active';

SELECT 
    'Total Attendance Records' AS Metric,
    COUNT(*) AS Value,
    'Attendance entries recorded' AS Description
FROM attendance;

SELECT 
    'Unique Students Enrolled' AS Metric,
    COUNT(DISTINCT student_id) AS Value,
    'Different students with active enrollments' AS Description
FROM classlist WHERE status = 'active';

SELECT 
    'Average Class Size' AS Metric,
    ROUND(AVG(enrolled_count), 2) AS Value,
    'Average students per class' AS Description
FROM v_teacher_classes;

-- ============================================================================
-- SECTION 8: TEACHER ASSIGNMENT VERIFICATION
-- ============================================================================

SELECT '=== TEACHER ASSIGNMENT VERIFICATION ===' AS '';

-- Teachers with subjects
SELECT 
    CONCAT(t.first_name, ' ', t.last_name) AS Teacher,
    COUNT(DISTINCT s.id) AS 'Subjects',
    COUNT(DISTINCT c.id) AS 'Classes',
    SUM(CASE WHEN c.is_active THEN 1 ELSE 0 END) AS 'Active Classes'
FROM teachers t
LEFT JOIN subjects s ON t.id = s.teacher_id
LEFT JOIN classes c ON t.id = c.teacher_id
GROUP BY t.id, t.first_name, t.last_name
ORDER BY COUNT(DISTINCT c.id) DESC
LIMIT 10;

-- ============================================================================
-- SECTION 9: COMMON QUERY TESTS
-- ============================================================================

SELECT '=== COMMON QUERY TESTS ===' AS '';

-- Test: Get teacher's classes (common query)
SELECT 
    'Get Teacher Classes Query' AS Test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS ✓ (Query executes)'
        ELSE 'FAIL ✗'
    END AS Result
FROM v_teacher_classes
WHERE teacher_id = (SELECT MIN(id) FROM teachers)
LIMIT 1;

-- Test: Get class students (common query)
SELECT 
    'Get Class Students Query' AS Test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS ✓ (Query executes)'
        ELSE 'FAIL ✗'
    END AS Result
FROM v_classlist_complete
WHERE class_id = (SELECT MIN(id) FROM classes)
LIMIT 1;

-- Test: Get today's attendance (common query)
SELECT 
    'Get Today Attendance Query' AS Test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS ✓ (Query executes)'
        ELSE 'FAIL ✗'
    END AS Result
FROM v_attendance_complete
WHERE date = CURDATE()
LIMIT 1;

-- ============================================================================
-- SECTION 10: RECOMMENDATIONS
-- ============================================================================

SELECT '=== RECOMMENDATIONS ===' AS '';

-- Check if there are inactive classes
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('INFO ℹ: ', COUNT(*), ' inactive classes found. Consider archiving or cleaning up.')
        ELSE 'OK ✓: No inactive classes to clean up.'
    END AS Recommendation
FROM classes WHERE is_active = FALSE;

-- Check for enrollments without recent attendance
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('INFO ℹ: ', COUNT(*), ' active enrollments have no attendance records.')
        ELSE 'OK ✓: All active enrollments have attendance records.'
    END AS Recommendation
FROM classlist cl
WHERE cl.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM attendance a WHERE a.classlist_id = cl.id
);

-- Check for classes without enrollments
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('WARNING ⚠: ', COUNT(*), ' active classes have no enrolled students.')
        ELSE 'OK ✓: All active classes have students enrolled.'
    END AS Recommendation
FROM classes c
WHERE c.is_active = TRUE
AND NOT EXISTS (
    SELECT 1 FROM classlist cl WHERE cl.class_id = c.id AND cl.status = 'active'
);

-- ============================================================================
-- END OF VERIFICATION
-- ============================================================================

SELECT '=== VERIFICATION COMPLETE ===' AS '';
SELECT 'Review the results above to ensure everything is working correctly.' AS '';
SELECT 'If any tests show FAIL or WARNING, investigate and resolve before using the system.' AS '';

-- ============================================================================


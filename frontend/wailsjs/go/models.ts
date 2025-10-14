export namespace main {
	
	export class AdminDashboard {
	    total_students: number;
	    total_teachers: number;
	    working_students: number;
	    recent_logins: number;
	
	    static createFrom(source: any = {}) {
	        return new AdminDashboard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_students = source["total_students"];
	        this.total_teachers = source["total_teachers"];
	        this.working_students = source["working_students"];
	        this.recent_logins = source["recent_logins"];
	    }
	}
	export class Attendance {
	    id: number;
	    class_id: number;
	    date: string;
	    student_id: number;
	    time_in?: string;
	    time_out?: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new Attendance(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.class_id = source["class_id"];
	        this.date = source["date"];
	        this.student_id = source["student_id"];
	        this.time_in = source["time_in"];
	        this.time_out = source["time_out"];
	        this.status = source["status"];
	    }
	}
	export class ClassStudent {
	    id: number;
	    student_id: string;
	    first_name: string;
	    middle_name?: string;
	    last_name: string;
	    subject_id: number;
	
	    static createFrom(source: any = {}) {
	        return new ClassStudent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.student_id = source["student_id"];
	        this.first_name = source["first_name"];
	        this.middle_name = source["middle_name"];
	        this.last_name = source["last_name"];
	        this.subject_id = source["subject_id"];
	    }
	}
	export class Feedback {
	    id: number;
	    student_id: number;
	    student_id_str: string;
	    first_name: string;
	    middle_name?: string;
	    last_name: string;
	    student_name: string;
	    pc_number: string;
	    equipment_condition: string;
	    monitor_condition: string;
	    keyboard_condition: string;
	    mouse_condition: string;
	    comments?: string;
	    date_submitted: string;
	
	    static createFrom(source: any = {}) {
	        return new Feedback(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.student_id = source["student_id"];
	        this.student_id_str = source["student_id_str"];
	        this.first_name = source["first_name"];
	        this.middle_name = source["middle_name"];
	        this.last_name = source["last_name"];
	        this.student_name = source["student_name"];
	        this.pc_number = source["pc_number"];
	        this.equipment_condition = source["equipment_condition"];
	        this.monitor_condition = source["monitor_condition"];
	        this.keyboard_condition = source["keyboard_condition"];
	        this.mouse_condition = source["mouse_condition"];
	        this.comments = source["comments"];
	        this.date_submitted = source["date_submitted"];
	    }
	}
	export class LoginLog {
	    id: number;
	    user_id: number;
	    user_name: string;
	    user_type: string;
	    pc_number?: string;
	    login_time: string;
	    logout_time?: string;
	
	    static createFrom(source: any = {}) {
	        return new LoginLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.user_id = source["user_id"];
	        this.user_name = source["user_name"];
	        this.user_type = source["user_type"];
	        this.pc_number = source["pc_number"];
	        this.login_time = source["login_time"];
	        this.logout_time = source["logout_time"];
	    }
	}
	export class StudentDashboard {
	    attendance: Attendance[];
	    today_log?: Attendance;
	
	    static createFrom(source: any = {}) {
	        return new StudentDashboard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.attendance = this.convertValues(source["attendance"], Attendance);
	        this.today_log = this.convertValues(source["today_log"], Attendance);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Subject {
	    id: number;
	    code: string;
	    name: string;
	    teacher: string;
	    room: string;
	    schedule: string;
	
	    static createFrom(source: any = {}) {
	        return new Subject(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.code = source["code"];
	        this.name = source["name"];
	        this.teacher = source["teacher"];
	        this.room = source["room"];
	        this.schedule = source["schedule"];
	    }
	}
	export class TeacherDashboard {
	    subjects: Subject[];
	    attendance: Attendance[];
	
	    static createFrom(source: any = {}) {
	        return new TeacherDashboard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.subjects = this.convertValues(source["subjects"], Subject);
	        this.attendance = this.convertValues(source["attendance"], Attendance);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class User {
	    id: number;
	    password: string;
	    name: string;
	    first_name?: string;
	    middle_name?: string;
	    last_name?: string;
	    gender?: string;
	    role: string;
	    employee_id?: string;
	    student_id?: string;
	    year?: string;
	    section?: string;
	    photo_url?: string;
	    created: string;
	    login_log_id: number;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.password = source["password"];
	        this.name = source["name"];
	        this.first_name = source["first_name"];
	        this.middle_name = source["middle_name"];
	        this.last_name = source["last_name"];
	        this.gender = source["gender"];
	        this.role = source["role"];
	        this.employee_id = source["employee_id"];
	        this.student_id = source["student_id"];
	        this.year = source["year"];
	        this.section = source["section"];
	        this.photo_url = source["photo_url"];
	        this.created = source["created"];
	        this.login_log_id = source["login_log_id"];
	    }
	}
	export class WorkingStudentDashboard {
	    students_registered: number;
	    classlists_created: number;
	
	    static createFrom(source: any = {}) {
	        return new WorkingStudentDashboard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.students_registered = source["students_registered"];
	        this.classlists_created = source["classlists_created"];
	    }
	}

}


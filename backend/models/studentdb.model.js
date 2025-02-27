import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
    course_code: String,
    course_name: String,
    instructor: String,
    credits: Number,
    semester: Number
});

const SemesterGpaSchema = new mongoose.Schema({
    semester: Number,
    gpa: Number
});

const AttendanceSchema = new mongoose.Schema({
    total_classes: Number,
    attended_classes: Number,
    percentage: Number
});

const PerCourseAttendanceSchema = new mongoose.Schema({
    course_code: String,
    total_classes: Number,
    attended_classes: Number,
    percentage: Number
});

const AcademicDetailsSchema = new mongoose.Schema({
    enrollment: {
        student_id: String,
        admission_year: Number,
        department: String,
        program: String,
        current_semester: Number
    },
    courses: [CourseSchema],
    academic_performance: {
        cgpa: Number,
        semester_wise_gpa: [SemesterGpaSchema]
    },
    backlogs: [String],
    attendance: {
        total_classes: Number,
        attended_classes: Number,
        percentage: Number,
        per_course_attendance: [PerCourseAttendanceSchema]
    }
});

const StudentSchema = new mongoose.Schema({
    
    academic_details: AcademicDetailsSchema
}, {});

const Student = mongoose.model('std_datas', StudentSchema);
export default Student;

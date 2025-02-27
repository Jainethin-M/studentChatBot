
import nlp from 'compromise';
import { createCanvas } from 'canvas';
import Chart from 'chart.js/auto';
import base64 from 'base64-js';

import Student from '../models/studentdb.model.js';

// dotenv.config();
// const connectDB = async () => {
//     try {
//             const conn = await mongoose.connect("mongodb+srv://toharivenkat:hari2444@clusterhv.ew0w3qw.mongodb.net/CampusConnect?retryWrites=true&w=majority&appName=Clusterhv");
//             console.log(`MongoDB Connected: ${conn.connection.host}`);
//         } catch (err) {
//             console.error(`Error: ${err.message}`);
//             process.exit(1);
//         } 
// }
// await connectDB();


class StudentAcademicChatbot {
    studentsCollection = Student;
  constructor() {
    

    this.nlp = nlp;

    
    

    this.intentPatterns = {
      overall_performance: ['performance', 'gpa', 'grades', 'academic standing', 'total performance', 'cumulative performance', 'cgpa'],
      course_details: ['course', 'courses', 'class', 'subject', 'enrolled courses', 'course information'],
      attendance: ['attendance', 'classes', 'present', 'absent', 'class participation', 'how many classes', 'attendance percentage'],
      semester_performance: ['semester', 'semester gpa', 'last semester', 'performance this semester'],
      current_semester: ['current semester', 'what semester am i in', 'which semester', 'semester'],
      credit_status: ['credits', 'total credits', 'remaining credits', 'credit requirements', 'credits completed', 'credits left'],
      program_details: ['program', 'department', 'admission', 'admission year', 'enrollment details', 'department details'],
      performance_trend: ['trend', 'progress', 'performance trend', 'grade trend', 'improvement', 'academic progress'],
      attendance_alert: ['attendance risk', 'attendance warning', 'low attendance', 'attendance status', 'attendance requirement'],
      course_load: ['course load', 'credit load', 'workload', 'credits this semester', 'semester load']
    };
  }
//   done
  async retrieveStudentData(studentId) {
    try {
      // console.log(`Attempting to retrieve data for student ID: ${studentId}`);
      const studentData = await this.studentsCollection.findOne({ _id: studentId });
      if (studentData) {
        // console.log(`Found data for student: ${studentId}`);
        return studentData;
      } else {
        // console.log(`No data found for student ID: ${studentId}`);
        const allIds = await this.studentsCollection.distinct('_id');
        // console.log(`Available student IDs in database: ${allIds}`);
        return null;
      }
    } catch (err) {
      console.error(`Error retrieving student data: ${err}`);
      return null;
    }
  }
// done
  classifyIntent(query) {
    const queryLower = query.toLowerCase();
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      if (patterns.some(pattern => queryLower.includes(pattern))) {
        return intent;
      }
    }
    return 'default';
  }
// done
  preprocessQuery(query, studentId = null) {
    const queryLower = query.toLowerCase();
    let detectedIntent = this.classifyIntent(query);
    const entities = {
      student_id: studentId || '67bffe6d84ff963737ab96af',
      course_code: null,
      semester: null
    };

    if (queryLower.includes('cgpa') || queryLower.includes('cumulative gpa')) {
      detectedIntent = 'overall_performance';
    }

    const potentialSemester = queryLower.match(/\d+/);
    entities.semester = potentialSemester ? parseInt(potentialSemester[0], 10) : null;

    const courseCodes = ['BUS580', 'BUS628', 'BUS68', 'BUS135', 'BUS972'];
    for (const code of courseCodes) {
      if (queryLower.includes(code.toLowerCase())) {
        entities.course_code = code;
        break;
      }
    }

    return {
      intent: detectedIntent,
      entities
    };
  }

  async generateResponse(queryAnalysis, studentData) {
    const intent = queryAnalysis.intent;
    switch (intent) {
      case 'overall_performance':
        return this.performanceResponse(studentData);
      case 'course_details':
        return this.courseDetailsResponse(studentData, queryAnalysis.entities);
      case 'attendance':
        return this.attendanceResponse(studentData, queryAnalysis.entities);
      case 'semester_performance':
        return this.semesterPerformanceResponse(studentData, queryAnalysis.entities);
      case 'current_semester':
        return this.currentSemesterResponse(studentData);
      case 'credit_status':
        return this.creditStatusResponse(studentData);
      case 'program_details':
        return this.programDetailsResponse(studentData);
      case 'performance_trend':
        return this.performanceTrendResponse(studentData);
      case 'attendance_alert':
        return this.attendanceAlertResponse(studentData);
      case 'course_load':
        return this.courseLoadResponse(studentData);
      default:
        return "I apologize, but I couldn't understand your specific query. Could you please rephrase?";
    }
  }

  performanceResponse(studentData) {
    const academicPerformance = studentData.academic_details.academic_performance || {};
    const cgpa = academicPerformance.cgpa || 'N/A';
    const semesterWiseGpa = academicPerformance.semester_wise_gpa || [];
    const currentSemesterGpa = semesterWiseGpa.length ? semesterWiseGpa[semesterWiseGpa.length - 1].gpa : 'N/A';

    return `Your current cumulative GPA is ${cgpa}. In the current semester, you've achieved a GPA of ${currentSemesterGpa}. Keep up the great work!`;
  }

  courseDetailsResponse(studentData, entities) {
    const courses = studentData.academic_details.courses || [];
    if (entities.course_code) {
      const specificCourse = courses.find(course => course.course_code === entities.course_code);
      if (specificCourse) {
        return `Course Details for ${specificCourse.course_code}: ${specificCourse.course_name} taught by ${specificCourse.instructor}. Credits: ${specificCourse.credits}. This course is in semester ${specificCourse.semester}.`;
      }
    }
    const courseList = courses.map(c => `${c.course_code}: ${c.course_name}`).join(', ');
    return `Your current courses are: ${courseList}`;
  }

  attendanceResponse(studentData, entities) {
    const attendance = studentData.academic_details.attendance || {};
    const perCourseAttendance = attendance.per_course_attendance || [];
    if (entities.course_code) {
      const courseAttendance = perCourseAttendance.find(course => course.course_code === entities.course_code);
      if (courseAttendance) {
        return `Your attendance for ${entities.course_code} is ${courseAttendance.percentage}%. You've attended ${courseAttendance.attended_classes} out of ${courseAttendance.total_classes} classes.`;
      }
    }
    return `Your total attendance is ${attendance.percentage || 'N/A'}%. You've attended ${attendance.attended_classes || 'N/A'} out of ${attendance.total_classes || 'N/A'} classes.`;
  }

  async semesterPerformanceResponse(studentData, entities) {
    try {
      const academicPerformance = studentData.academic_details.academic_performance || {};
      const semesterWiseGpa = academicPerformance.semester_wise_gpa || [];
      if (entities.semester) {
        const targetSemester = entities.semester;
        const semesterData = semesterWiseGpa.find(sem => sem.semester === targetSemester);
        if (semesterData) {
          return `**Semester ${targetSemester} Performance**\n• GPA: ${semesterData.gpa}\n• Courses Taken: ${semesterData.courses_count || 'N/A'}\n• Performance Notes: ${semesterData.performance_notes || 'No additional notes'}`;
        }
      }
      const performanceSummary = semesterWiseGpa.map(sem => `Semester ${sem.semester}: GPA ${sem.gpa}`).join('\n');
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');
      const configuration = {
        type: 'bar',
        data: {
          labels: semesterWiseGpa.map(sem => `Semester ${sem.semester}`),
          datasets: [{
            label: 'GPA',
            data: semesterWiseGpa.map(sem => sem.gpa),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };
      new Chart(ctx, configuration);
      const image = canvas.toBuffer();
      const imgUrl = base64.fromByteArray(image);
      return `**Semester Performance Summary**\n${performanceSummary}\n<img src="data:image/png;base64,${imgUrl}">`;
    } catch (err) {
      return `Error retrieving semester performance: ${err}`;
    }
  }

  currentSemesterResponse(studentData) {
    const enrollmentData = studentData.academic_details.enrollment || {};
    const currentSemester = enrollmentData.current_semester || 'N/A';
    return currentSemester !== 'N/A' ? `Your current semester is ${currentSemester}.` : "Sorry, I couldn't find your current semester information.";
  }

  creditStatusResponse(studentData) {
    const creditStatus = this.calculateCreditStatus(studentData);
  
    return (
      `You are currently taking ${creditStatus.currentSemesterCredits} ` +
      `credits this semester. Your semester-wise credit distribution is: ` +
      `${Object.entries(creditStatus.creditDistribution).map(([sem, credits]) => `Semester ${sem}: ${credits} credits`).join(', ')}`
    );
  }
  
  calculateCreditStatus(studentData) {
    const academicDetails = studentData.academic_details || {};
    const creditDistribution = academicDetails.credit_distribution || {};
    const currentSemesterCredits = academicDetails.current_semester_credits || 'N/A';
  
    return {
      currentSemesterCredits,
      creditDistribution
    };
  }

  performanceTrendResponse(studentData) {
    const trend = this.analyzePerformanceTrend(studentData);
  
    if (trend.trend === 'No data available') {
      return "Sorry, not enough data to analyze performance trend.";
    }
  
    const trendDirection = trend.improving ? "improving" : "declining";
  
    return (
      `Your academic performance is ${trendDirection}. ` +
      `Your GPA changed by ${Math.abs(trend.recentChange).toFixed(2)} points last semester. ` +
      `Your highest GPA so far is ${trend.highestGpa.toFixed(2)}.`
    );
  }
  
  analyzePerformanceTrend(studentData) {
    // Implement the logic to analyze the performance trend
    // This is a placeholder implementation
    const academicPerformance = studentData.academic_details.academic_performance || {};
    const semesterWiseGpa = academicPerformance.semester_wise_gpa || [];
  
    if (semesterWiseGpa.length < 2) {
      return { trend: 'No data available' };
    }
  
    const recentChange = semesterWiseGpa[semesterWiseGpa.length - 1].gpa - semesterWiseGpa[semesterWiseGpa.length - 2].gpa;
    const highestGpa = Math.max(...semesterWiseGpa.map(sem => sem.gpa));
    const improving = recentChange > 0;
  
    return {
      trend: 'Data available',
      recentChange,
      highestGpa,
      improving
    };
  }
  
  attendanceAlertResponse(studentData) {
    const riskData = this.checkAttendanceRisk(studentData);
  
    if (!riskData.atRiskCourses.length) {
      return "Your attendance is above the minimum requirement in all courses.";
    }
  
    const riskMessages = riskData.atRiskCourses.map(course => (
      `${course.course_code}: Currently at ${course.current_percentage}%. ` +
      `Need to attend ${course.classes_needed} more classes to reach ${riskData.risk_threshold}%`
    ));
  
    return (
      `Attendance Alert: You have ${riskData.atRiskCourses.length} courses ` +
      `below ${riskData.risk_threshold}% attendance:\n` + 
      riskMessages.join('\n')
    );
  }
  
  checkAttendanceRisk(studentData) {
    // Implement the logic to check attendance risk
    // This is a placeholder implementation
    const academicDetails = studentData.academic_details || {};
    const attendance = academicDetails.attendance || {};
    const riskThreshold = 75; // Example threshold
    const atRiskCourses = [];
  
    for (const course of attendance.per_course_attendance || []) {
      if (course.percentage < riskThreshold) {
        const classesNeeded = Math.ceil((riskThreshold / 100) * course.total_classes) - course.attended_classes;
        atRiskCourses.push({
          course_code: course.course_code,
          current_percentage: course.percentage,
          classes_needed: classesNeeded
        });
      }
    }
  
    return {
      risk_threshold: riskThreshold,
      at_risk_courses: atRiskCourses
    };
  }

  courseLoadResponse(studentData) {
    const loadAnalysis = this.analyzeCourseLoad(studentData);
  
    return (
      `You are currently taking ${loadAnalysis.totalCourses} courses ` +
      `with a total of ${loadAnalysis.totalCredits} credits. ` +
      `This includes ${loadAnalysis.creditDistribution.oneCreditCourses} ` +
      `one-credit courses and ` +
      `${loadAnalysis.creditDistribution.fourCreditCourses} ` +
      `four-credit courses.`
    );
  }
  
  analyzeCourseLoad(studentData) {
    // Implement the logic to analyze course load
    // This is a placeholder implementation
    const academicDetails = studentData.academic_details || {};
    const courses = academicDetails.courses || [];
    const totalCourses = courses.length;
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const oneCreditCourses = courses.filter(course => course.credits === 1).length;
    const fourCreditCourses = courses.filter(course => course.credits === 4).length;
  
    return {
      totalCourses,
      totalCredits,
      creditDistribution: {
        oneCreditCourses,
        fourCreditCourses
      }
    };
  }

  programDetailsResponse(studentData) {
    const enrollment = studentData.academic_details?.enrollment || {};
  
    return (
      `You are enrolled in the ${enrollment.program || 'N/A'} program ` +
      `in the ${enrollment.department || 'N/A'} department. ` +
      `You were admitted in ${enrollment.admission_year || 'N/A'}.`
    );
  }

  async chat(query, studentId = null) {
    const queryAnalysis = this.preprocessQuery(query, studentId);
    const currentStudentId = queryAnalysis.entities.student_id;
    const studentData = await this.retrieveStudentData(currentStudentId);
    if (!studentData) {
      return "Sorry, could not find student information. Please check the student ID.";
    }
    return this.generateResponse(queryAnalysis, studentData);
  }
}

// Create an instance of the StudentAcademicChatbot class
const chatbot = new StudentAcademicChatbot();

// Function to ask a question to the chatbot
export const askQuestion = async(query, studentId) => {
  try {
    const response = await chatbot.chat(query, studentId);
    // console.log(response);
    return response;
  } catch (err) {
    console.error(`Error asking question: ${err}`);
    return err
  }
}


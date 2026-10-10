# School Database Design

## 1. Tables and Their Purpose

### Students
The students table stores information about each student. It contains student_id as the primary key, name, and email. The email field is UNIQUE and NOT NULL so that every student has a distinct email address.

### Courses
The courses table stores the courses offered by the school. It contains course_id as the primary key and course_name, which is required and unique.

### Enrolments
The enrolments table records which students are enrolled in which courses. It contains enrolment_id as the primary key, student_id and course_id as foreign keys, and grade to store a student's performance in a course. Both foreign keys are required. A UNIQUE constraint on student_id and course_id prevents the same student from enrolling in the same course more than once.

## 2. Relationships

### One-to-Many
The relationship between students and enrolments is one-to-many because one student can have multiple enrolment records, but each enrolment belongs to one student.

The relationship between courses and enrolments is also one-to-many because one course can have multiple enrolment records, but each enrolment refers to one course.

### Many-to-Many
Students and courses have a many-to-many relationship. A student can enrol in several courses, and each course can have several students.

The enrolments table is needed as a join table to connect students and courses. It resolves the many-to-many relationship into two one-to-many relationships. It also stores additional information about each enrolment, such as the student's grade.

## 3. Index

I would add an index on the course_id column in the enrolments table:

```sql
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);
```

This index can improve queries that retrieve students enrolled in a particular course and queries that group enrolments by course. The UNIQUE constraint on student_id and course_id already creates an index for that column combination, but it does not replace an index dedicated to course_id.

## 4. SQL or NoSQL?

I would choose SQL for this school database because the data is structured and has clear relationships between students, courses, and enrolments. SQLite supports primary keys, foreign keys, UNIQUE constraints, and JOIN operations, which help maintain data integrity and retrieve related information accurately. SQL is also well suited to counting enrolments, managing grades, and updating records. A NoSQL database could be useful if the system needed highly flexible document structures or a different scaling model, but a relational database is the more appropriate choice for this assignment.
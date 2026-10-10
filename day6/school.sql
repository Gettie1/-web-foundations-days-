-- Day 6 Assignment: School Database
-- Repository: web-foundations-days
-- Folder: day6/

PRAGMA foreign_keys = ON;

-- 1. Create the students table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- 2. Create the courses table
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL UNIQUE
);

-- 3. Create the enrolments table
-- This join table connects students and courses.
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade REAL,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (student_id, course_id)
);

-- Insert sample students
INSERT INTO students (student_id, name, email) VALUES
(1, 'Amina Wanjiku', 'amina@example.com'),
(2, 'Brian Otieno', 'brian@example.com'),
(3, 'Carol Chebet', 'carol@example.com'),
(4, 'David Kamau', 'david@example.com');

-- Insert sample courses
INSERT INTO courses (course_id, course_name) VALUES
(1, 'Web Development'),
(2, 'Database Systems'),
(3, 'Computer Networks');

-- Insert sample enrolments
INSERT INTO enrolments
    (enrolment_id, student_id, course_id, grade)
VALUES
(1, 1, 1, 85),
(2, 1, 2, 90),
(3, 2, 1, 78),
(4, 2, 3, 82),
(5, 3, 2, 88);

-- QUERY 1: All courses for one student by name
SELECT s.name, c.course_name, e.grade
FROM students AS s
JOIN enrolments AS e ON s.student_id = e.student_id
JOIN courses AS c ON e.course_id = c.course_id
WHERE s.name = 'Amina Wanjiku';

-- QUERY 2: All students enrolled on one course
SELECT s.name, s.email, c.course_name
FROM students AS s
JOIN enrolments AS e ON s.student_id = e.student_id
JOIN courses AS c ON e.course_id = c.course_id
WHERE c.course_name = 'Web Development';

-- QUERY 3: Number of students per course, including courses
-- with zero students
SELECT c.course_name,
       COUNT(e.student_id) AS number_of_students
FROM courses AS c
LEFT JOIN enrolments AS e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name;

-- QUERY 4: Students who have no enrolments
SELECT s.student_id, s.name, s.email
FROM students AS s
LEFT JOIN enrolments AS e ON s.student_id = e.student_id
WHERE e.student_id IS NULL;

-- QUERY 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 92
WHERE enrolment_id = 1;

-- Verify the grade update
SELECT s.name, c.course_name, e.grade
FROM enrolments AS e
JOIN students AS s ON e.student_id = s.student_id
JOIN courses AS c ON e.course_id = c.course_id
WHERE e.enrolment_id = 1;
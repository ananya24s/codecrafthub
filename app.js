// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Path to the courses data file
const COURSES_FILE = path.join(__dirname, 'data', 'courses.json');

// Ensure the data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Utility function to read courses data from JSON file
function readCourses() {
    return new Promise((resolve, reject) => {
        fs.readFile(COURSES_FILE, 'utf8', (err, data) => {
            if (err) {
                // If file doesn't exist, start with an empty array
                if (err.code === 'ENOENT') {
                    fs.writeFile(COURSES_FILE, '[]', 'utf8', (err) => {
                        if (err) reject(err);
                        else resolve([]);
                    });
                } else {
                    reject(err);
                }
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (parseErr) {
                    reject(parseErr);
                }
            }
        });
    });
}

// Utility function to write courses data to JSON file
function writeCourses(courses) {
    return new Promise((resolve, reject) => {
        fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2), 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// POST /api/courses - Add a new course
app.post('/api/courses', async (req, res) => {
    try {
        const { name, description, target_date, status } = req.body;

        // Validate required fields
        if (!name || !description || !target_date || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate status value
        const validStatuses = ['Not Started', 'In Progress', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Read existing courses
        let courses = await readCourses();

        // Generate new course ID
        const newId = courses.length + 1;

        // Create new course
        const newCourse = {
            id: newId,
            name,
            description,
            target_date,
            status,
            created_at: new Date().toISOString()
        };

        // Add new course to the array
        courses.push(newCourse);

        // Write updated courses back to file
        await writeCourses(courses);

        res.status(201).json(newCourse);
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/courses - Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await readCourses();
        res.json(courses);
    } catch (error) {
        console.error('Error reading courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/courses/:id - Get a specific course
app.get('/api/courses/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const courses = await readCourses();
        const course = courses.find(course => course.id === parseInt(id));

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Error reading courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/courses/:id - Update a course
app.put('/api/courses/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, target_date, status } = req.body;

    try {
        const courses = await readCourses();
        const courseIndex = courses.findIndex(course => course.id === parseInt(id));

        // Course not found
        if (courseIndex === -1) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Validate status value
        const validStatuses = ['Not Started', 'In Progress', 'Completed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Update course
        courses[courseIndex] = {
            ...courses[courseIndex],
            name: name || courses[courseIndex].name,
            description: description || courses[courseIndex].description,
            target_date: target_date || courses[courseIndex].target_date,
            status: status || courses[courseIndex].status
        };

        // Write updated courses back to file
        await writeCourses(courses);

        res.json(courses[courseIndex]);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/courses/:id - Delete a course
app.delete('/api/courses/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const courses = await readCourses();
        const courseIndex = courses.findIndex(course => course.id === parseInt(id));

        // Course not found
        if (courseIndex === -1) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Remove course from array
        courses.splice(courseIndex, 1);

        // Write updated courses back to file
        await writeCourses(courses);

        res.sendStatus(204); // No content
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// This file will handle saving and loading projects from local storage.

const STORAGE_KEY = 'pixelSketchProjects';

class ProjectStorage {
    constructor() {
        this.seedInitialData();
    }

    seedInitialData() {
        if (!localStorage.getItem(STORAGE_KEY) || JSON.parse(localStorage.getItem(STORAGE_KEY)).length === 0) {
            const sampleProjects = [
                {
                    id: `proj-${Date.now()}-1`,
                    name: "Bouncing Ball",
                    canvasSize: { width: 32, height: 32 },
                    fps: 12,
                    palette: [],
                    frames: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: `proj-${Date.now()}-2`,
                    name: "Running Fox",
                    canvasSize: { width: 64, height: 64 },
                    fps: 15,
                    palette: [],
                    frames: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProjects));
        }
    }

    getProjects() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    }

    saveProject(projectData) {
        const projects = this.getProjects();
        const existingIndex = projects.findIndex(p => p.id === projectData.id);

        if (existingIndex > -1) {
            projects[existingIndex] = projectData;
        } else {
            projects.push(projectData);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        console.log("Project saved:", projectData.name);
    }

    deleteProject(projectId) {
        let projects = this.getProjects();
        projects = projects.filter(p => p.id !== projectId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        console.log("Project deleted:", projectId);
    }

    getProject(projectId) {
        const projects = this.getProjects();
        return projects.find(p => p.id === projectId);
    }
}

// Instantiate the storage handler
const projectStorage = new ProjectStorage();

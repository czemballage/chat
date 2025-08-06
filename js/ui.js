// This file will handle UI updates, like drawing the project list, updating the timeline, etc.

function renderProjectList() {
    const projects = projectStorage.getProjects();
    const projectListEl = document.getElementById('projectList');
    projectListEl.innerHTML = ''; // Clear existing list

    if (projects.length === 0) {
        projectListEl.innerHTML = `<p>No projects yet. Create one!</p>`;
        return;
    }

    projects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        projectItem.dataset.id = project.id;
        projectItem.innerHTML = `
            <div class="thumbnail"></div>
            <h3>${project.name}</h3>
            <p>Updated: ${new Date(project.updatedAt).toLocaleDateString()}</p>
            <button class="delete-project-btn">Delete</button>
        `;
        projectListEl.appendChild(projectItem);
    });
}

function renderColorPalette(project) {
    const paletteContainer = document.getElementById('color-palette-container');
    paletteContainer.innerHTML = '';
    project.palette.forEach((color, index) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        if (index === 0) { // Select first color by default
            swatch.classList.add('active');
        }
        paletteContainer.appendChild(swatch);
    });
}

function renderTimeline(project, activeFrameIndex = 0) {
    const timelineFrames = document.getElementById('timelineFrames');
    timelineFrames.innerHTML = '';
    project.frames.forEach((frame, index) => {
        const frameEl = document.createElement('div');
        frameEl.className = 'timeline-frame';
        frameEl.dataset.frameIndex = index;
        if (index === activeFrameIndex) {
            frameEl.classList.add('active');
        }
        frameEl.innerHTML = `<span class="frame-number">${index + 1}</span>`;
        // In the future, a thumbnail of the frame content will be rendered here
        timelineFrames.appendChild(frameEl);
    });
}

function initializeUI() {
    // FPS slider value display
    const fpsSlider = document.getElementById('fps');
    const fpsValue = document.getElementById('fpsValue');
    if (fpsSlider) {
        fpsSlider.addEventListener('input', () => {
            fpsValue.textContent = fpsSlider.value;
        });
    }

    // Custom canvas size inputs
    const canvasSizeSelect = document.getElementById('canvasSize');
    const customCanvasSizeDiv = document.getElementById('customCanvasSize');
    if (canvasSizeSelect) {
        canvasSizeSelect.addEventListener('change', () => {
            if (canvasSizeSelect.value === 'custom') {
                customCanvasSizeDiv.style.display = 'flex';
            } else {
                customCanvasSizeDiv.style.display = 'none';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeUI);

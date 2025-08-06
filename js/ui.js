// This file will handle UI updates, like drawing the project list, updating the timeline, etc.

function renderProjectList() {
    const projects = projectStorage.getProjects();
    const projectListEl = document.getElementById('projectList');
    projectListEl.innerHTML = '';

    if (projects.length === 0) {
        projectListEl.innerHTML = `<p class="empty-message">No projects yet. Let's create one!</p>`;
        return;
    }

    projects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        projectItem.dataset.id = project.id;

        // --- Thumbnail Generation ---
        const thumbnailCanvas = document.createElement('canvas');
        thumbnailCanvas.width = 128; // Fixed thumbnail size
        thumbnailCanvas.height = 128;
        const thumbCtx = thumbnailCanvas.getContext('2d');
        thumbCtx.imageSmoothingEnabled = false;

        const firstFrame = project.frames[0];
        if (firstFrame) {
            const scaleX = thumbnailCanvas.width / project.canvasSize.width;
            const scaleY = thumbnailCanvas.height / project.canvasSize.height;
            const scale = Math.min(scaleX, scaleY);

            const offsetX = (thumbnailCanvas.width - (project.canvasSize.width * scale)) / 2;
            const offsetY = (thumbnailCanvas.height - (project.canvasSize.height * scale)) / 2;

            thumbCtx.fillStyle = '#ffffff';
            thumbCtx.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

            for (let y = 0; y < project.canvasSize.height; y++) {
                for (let x = 0; x < project.canvasSize.width; x++) {
                    if (firstFrame[y][x]) {
                        thumbCtx.fillStyle = firstFrame[y][x];
                        thumbCtx.fillRect(offsetX + (x * scale), offsetY + (y * scale), scale, scale);
                    }
                }
            }
        }
        const thumbnailUrl = thumbnailCanvas.toDataURL();
        // --- End Thumbnail Generation ---

        const metadata = `
            <div class="project-meta">
                <span>${project.canvasSize.width}x${project.canvasSize.height}</span>
                <span>${project.frames.length} frames</span>
            </div>
        `;

        projectItem.innerHTML = `
            <img src="${thumbnailUrl}" alt="Project preview" class="thumbnail">
            <h3>${project.name}</h3>
            <div class="project-info">
                ${metadata}
                <p>Updated: ${new Date(project.updatedAt).toLocaleDateString()}</p>
            </div>
            <button class="delete-project-btn">X</button>
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

function setActiveColor(color) {
    const paletteContainer = document.getElementById('color-palette-container');
    const swatches = paletteContainer.querySelectorAll('.color-swatch');

    swatches.forEach(swatch => {
        if (swatch.dataset.color === color) {
            swatch.classList.add('active');
        } else {
            swatch.classList.remove('active');
        }
    });
}

function initializeUI() {
    // Color Palette Swatch selection
    const paletteContainer = document.getElementById('color-palette-container');
    if (paletteContainer) {
        paletteContainer.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (swatch) {
                setActiveColor(swatch.dataset.color);
            }
        });
    }

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

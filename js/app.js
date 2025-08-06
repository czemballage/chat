let currentProject = null;
let pixelCanvas = null;

function createBlankFrame(width, height) {
    // Create a 2D array representing the pixel grid, filled with a transparent color (null)
    return Array(height).fill(null).map(() => Array(width).fill(null));
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("PixelSketch Animate is ready!");

    pixelCanvas = new PixelCanvas('pixelCanvas');
    initSettings();

    // Canvas event listeners
    pixelCanvas.canvas.addEventListener('colorpicked', (e) => {
        setActiveColor(e.detail.color);
    });

    pixelCanvas.canvas.addEventListener('toolswitched', (e) => {
        const toolSidebar = document.querySelector('.tool-sidebar-left');
        const toolButtons = toolSidebar.querySelectorAll('.tool-button');
        toolButtons.forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${e.detail.tool}-tool`).classList.add('active');
    });

    // Basic screen navigation logic
    const screens = document.querySelectorAll('.screen');
    const newProjectBtn = document.getElementById('newProjectBtn');
    const cancelNewProjectBtn = document.getElementById('cancelNewProjectBtn');
    const newProjectForm = document.getElementById('newProjectForm');

    function showScreen(screenId) {
        // Stop any running animations when changing screens
        if (isPlaying) {
            playAnimationBtn.click(); // Simulate click to stop
        }
        if (previewAnimationId) {
            stopPreview();
        }

        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');

        if (screenId === 'drawingScreen') {
            startAutoSave();
        } else {
            stopAutoSave();
        }

        if (screenId === 'previewScreen') {
            startPreview();
        }
    }

    // Example navigation
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', () => {
        showScreen('settingsScreen');
    });

    newProjectBtn.addEventListener('click', () => {
        showScreen('newProjectScreen');
    });

    cancelNewProjectBtn.addEventListener('click', () => {
        showScreen('homeScreen');
    });

    newProjectForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const projectName = document.getElementById('projectName').value || 'Untitled Project';
        const canvasSizeSelect = document.getElementById('canvasSize');
        const fps = document.getElementById('fps').value;

        let canvasSize;
        if (canvasSizeSelect.value === 'custom') {
            const width = document.getElementById('canvasWidth').value;
            const height = document.getElementById('canvasHeight').value;
            canvasSize = { width: parseInt(width) || 32, height: parseInt(height) || 32 };
        } else {
            const [width, height] = canvasSizeSelect.value.split('x').map(Number);
            canvasSize = { width, height };
        }

        const newProject = {
            id: `proj-${Date.now()}`,
            name: projectName,
            canvasSize: canvasSize,
            fps: parseInt(fps),
            palette: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'], // Example palette
            frames: [ createBlankFrame(canvasSize.width, canvasSize.height) ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        projectStorage.saveProject(newProject);
        currentProject = newProject;

        document.getElementById('currentProjectName').textContent = currentProject.name;

        console.log("Starting new project:", currentProject);
        showScreen('drawingScreen');

        // Render the UI for the new project
        renderColorPalette(currentProject);
        renderTimeline(currentProject, 0);

        // Initialize canvas with project data
        pixelCanvas.init(currentProject);
    });

    const projectListContainer = document.getElementById('projectList');
    projectListContainer.addEventListener('click', (e) => {
        const projectItem = e.target.closest('.project-item');
        if (!projectItem) return;

        const projectId = projectItem.dataset.id;

        if (e.target.classList.contains('delete-project-btn')) {
            if (confirm('Are you sure you want to delete this project?')) {
                projectStorage.deleteProject(projectId);
                renderProjectList();
            }
        } else {
            const projectToLoad = projectStorage.getProject(projectId);
            if (projectToLoad) {
                currentProject = projectToLoad;
                document.getElementById('currentProjectName').textContent = currentProject.name;
                showScreen('drawingScreen');
                renderColorPalette(currentProject);
                renderTimeline(currentProject, 0);
                pixelCanvas.init(currentProject);
            }
        }
    });

    // Temp: Show splash then home
    setTimeout(() => {
        showScreen('homeScreen');
        renderProjectList();
    }, 1500);

    // Also render when returning to home
    cancelNewProjectBtn.addEventListener('click', () => {
        showScreen('homeScreen');
        renderProjectList(); // Re-render in case projects changed
    });

    // --- Frame Management Logic ---
    const timelineFramesContainer = document.getElementById('timelineFrames');
    const addFrameBtn = document.getElementById('add-frame-btn');
    const removeFrameBtn = document.getElementById('remove-frame-btn');
    const duplicateFrameBtn = document.getElementById('duplicate-frame-btn');

    // 1. Select a frame
    timelineFramesContainer.addEventListener('click', (e) => {
        const frameEl = e.target.closest('.timeline-frame');
        if (frameEl && currentProject) {
            const frameIndex = parseInt(frameEl.dataset.frameIndex, 10);
            if (pixelCanvas.selectFrame(frameIndex)) {
                renderTimeline(currentProject, frameIndex);
            }
        }
    });

    // 2. Add a new frame
    addFrameBtn.addEventListener('click', () => {
        if (!currentProject) return;
        const newFrame = createBlankFrame(currentProject.canvasSize.width, currentProject.canvasSize.height);
        currentProject.frames.push(newFrame);
        currentProject.isDirty = true;

        const newFrameIndex = currentProject.frames.length - 1;
        pixelCanvas.selectFrame(newFrameIndex);
        renderTimeline(currentProject, newFrameIndex);
    });

    // 3. Remove the current frame
    removeFrameBtn.addEventListener('click', () => {
        if (!currentProject) return;

        const frameIndexToRemove = pixelCanvas.currentFrameIndex;
        currentProject.frames.splice(frameIndexToRemove, 1);
        currentProject.isDirty = true;

        if (currentProject.frames.length === 0) {
            const newFrame = createBlankFrame(currentProject.canvasSize.width, currentProject.canvasSize.height);
            currentProject.frames.push(newFrame);
        }

        const newFrameIndex = Math.max(0, Math.min(frameIndexToRemove, currentProject.frames.length - 1));
        pixelCanvas.selectFrame(newFrameIndex);
        renderTimeline(currentProject, newFrameIndex);
    });

    // 4. Duplicate the current frame
    duplicateFrameBtn.addEventListener('click', () => {
        if (!currentProject) return;

        const currentFrameData = currentProject.frames[pixelCanvas.currentFrameIndex];
        const newFrameData = JSON.parse(JSON.stringify(currentFrameData)); // Deep copy

        const newFrameIndex = pixelCanvas.currentFrameIndex + 1;
        currentProject.frames.splice(newFrameIndex, 0, newFrameData);
        currentProject.isDirty = true;

        pixelCanvas.selectFrame(newFrameIndex);
        renderTimeline(currentProject, newFrameIndex);
    });

    // --- Tool Selection Logic ---
    const toolSidebar = document.querySelector('.tool-sidebar-left');

    toolSidebar.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button || !pixelCanvas) return;

        // Don't treat non-tool buttons as selectable tools
        if (!button.classList.contains('tool-button')) return;

        const tool = button.id.replace('-tool', '');
        pixelCanvas.setTool(tool);

        // Update active class
        const toolButtons = toolSidebar.querySelectorAll('.tool-button');
        toolButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });

    // --- Onion Skin and Animation Preview ---
    const onionSkinBtn = document.getElementById('onion-skin-btn');
    const playAnimationBtn = document.getElementById('play-animation-btn');

    let isPlaying = false;
    let animationIntervalId = null;

    onionSkinBtn.addEventListener('click', () => {
        if (!pixelCanvas) return;
        pixelCanvas.toggleOnionSkin();
        onionSkinBtn.classList.toggle('active', pixelCanvas.onionSkinEnabled);
    });

    playAnimationBtn.addEventListener('click', () => {
        if (isPlaying) {
            clearInterval(animationIntervalId);
            animationIntervalId = null;
            isPlaying = false;
            playAnimationBtn.textContent = 'Play';
        } else {
            isPlaying = true;
            playAnimationBtn.textContent = 'Stop';
            const fps = currentProject ? currentProject.fps : 12;
            animationIntervalId = setInterval(() => {
                if (!currentProject || currentProject.frames.length < 2) return;
                let nextFrameIndex = pixelCanvas.currentFrameIndex + 1;
                if (nextFrameIndex >= currentProject.frames.length) {
                    nextFrameIndex = 0;
                }
                pixelCanvas.selectFrame(nextFrameIndex);
                renderTimeline(currentProject, nextFrameIndex);
            }, 1000 / fps);
        }
    });

    // --- Auto-Save Logic ---
    const saveIndicator = document.getElementById('saveIndicator');
    let autoSaveIntervalId = null;

    function startAutoSave() {
        if (autoSaveIntervalId) return;
        autoSaveIntervalId = setInterval(() => {
            if (currentProject && currentProject.isDirty) {
                saveIndicator.textContent = 'Saving...';
                projectStorage.saveProject(currentProject);
                currentProject.isDirty = false;
                setTimeout(() => {
                    saveIndicator.textContent = 'Saved';
                    setTimeout(() => { saveIndicator.textContent = '' }, 2000);
                }, 1000);
            }
        }, 5000);
    }

    function stopAutoSave() {
        clearInterval(autoSaveIntervalId);
        autoSaveIntervalId = null;
        if (currentProject && currentProject.isDirty) {
            saveIndicator.textContent = 'Saving...';
            projectStorage.saveProject(currentProject);
            currentProject.isDirty = false;
            saveIndicator.textContent = 'Saved';
            setTimeout(() => { saveIndicator.textContent = '' }, 2000);
        }
    }

    // --- Export Logic ---
    const exportBtn = document.getElementById('export-btn');
    const cancelExportBtn = document.getElementById('cancelExportBtn');
    const exportForm = document.getElementById('exportForm');
    const exportStatus = document.getElementById('exportStatus');

    exportBtn.addEventListener('click', () => {
        if (currentProject) {
            showScreen('exportScreen');
            exportStatus.textContent = '';
        }
    });

    cancelExportBtn.addEventListener('click', () => {
        showScreen('drawingScreen');
    });

    exportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentProject) return;

        const format = document.getElementById('exportFormat').value;
        const scale = parseInt(document.getElementById('exportScale').value, 10);
        const submitBtn = e.target.querySelector('button[type="submit"]');

        exportStatus.textContent = 'Starting export...';
        submitBtn.disabled = true;

        try {
            let blob;
            let filename = `${currentProject.name.replace(/ /g, '_')}`;

            if (format === 'png-zip') {
                blob = await exportToPngZip(currentProject, scale);
                filename += '.zip';
            } else if (format === 'gif') {
                const options = {
                    loop: document.getElementById('gifLoop').checked,
                    transparent: document.getElementById('gifTransparent').checked,
                };
                blob = await exportToGif(currentProject, scale, options);
                filename += '.gif';
            } else if (format === 'mp4') {
                blob = await exportToMp4(currentProject, scale);
                filename += '.mp4';
            }

            if (blob) {
                triggerDownload(blob, filename);
                exportStatus.textContent = 'Export complete!';
            }
        } catch (error) {
            console.error('Export failed:', error);
            exportStatus.textContent = `Export failed: ${error.message}`;
        } finally {
            submitBtn.disabled = false;
        }
    });

    // --- Preview Screen Logic ---
    const previewBtn = document.getElementById('preview-btn');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    let previewAnimationId = null;

    function startPreview() {
        if (!currentProject || previewAnimationId) return;
        let currentFrame = 0;
        const fps = currentProject.fps;
        const canvasSize = currentProject.canvasSize;
        const container = previewCanvas.parentElement;
        const scaleX = container.clientWidth / canvasSize.width;
        const scaleY = container.clientHeight / canvasSize.height;
        const scale = Math.min(scaleX, scaleY) * 0.9; // Use 90% of available space
        previewCanvas.width = canvasSize.width * scale;
        previewCanvas.height = canvasSize.height * scale;
        previewCtx.imageSmoothingEnabled = false;

        function animate() {
            drawScaledFrame(previewCtx, currentProject.frames[currentFrame], canvasSize, scale);
            currentFrame = (currentFrame + 1) % currentProject.frames.length;
            previewAnimationId = setTimeout(() => requestAnimationFrame(animate), 1000 / fps);
        }
        animate();
    }

    function stopPreview() {
        clearTimeout(previewAnimationId);
        previewAnimationId = null;
    }

    previewBtn.addEventListener('click', () => {
        if (currentProject) {
            showScreen('previewScreen');
        }
    });

    closePreviewBtn.addEventListener('click', () => {
        showScreen('drawingScreen');
    });
});

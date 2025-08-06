class PixelCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Keep pixels sharp

        this.project = null;
        this.currentFrameIndex = 0;
        this.isDrawing = false;
        this.onionSkinEnabled = false;
        this.gridEnabled = true;
        this.onionSkinOpacity = 0.25;
        this.currentTool = 'pencil';
        this.previousTool = 'pencil';

        this.addEventListeners();
        console.log("Pixel canvas ready.");
    }

    setTool(tool) {
        if (this.currentTool !== 'color-picker') {
            this.previousTool = this.currentTool;
        }
        this.currentTool = tool;
        console.log("Tool changed to:", tool);
    }

    init(project) {
        this.project = project;
        this.currentFrameIndex = 0;
        this.canvas.width = this.project.canvasSize.width;
        this.canvas.height = this.project.canvasSize.height;
        this.fitToContainer();
        this.render();
    }

    toggleOnionSkin() {
        this.onionSkinEnabled = !this.onionSkinEnabled;
        this.render();
    }

    toggleGrid(isEnabled) {
        this.gridEnabled = isEnabled;
        this.render();
    }

    setOnionSkinOpacity(opacity) {
        this.onionSkinOpacity = opacity;
        this.render();
    }

    selectFrame(frameIndex) {
        if (this.project && frameIndex >= 0 && frameIndex < this.project.frames.length) {
            this.currentFrameIndex = frameIndex;
            this.render();
            return true;
        }
        return false;
    }

    fitToContainer() {
        const container = this.canvas.parentElement;
        if (!container) return;
        const maxWidth = container.clientWidth * 0.95;
        const maxHeight = container.clientHeight * 0.95;
        const ratio = this.canvas.width / this.canvas.height;
        let newWidth = maxWidth;
        let newHeight = newWidth / ratio;
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * ratio;
        }
        this.canvas.style.width = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;
    }

    render() {
        if (!this.project) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.onionSkinEnabled) {
            const prevFrame = this.project.frames[this.currentFrameIndex - 1];
            const nextFrame = this.project.frames[this.currentFrameIndex + 1];
            this.drawSingleFrame(prevFrame, { alpha: this.onionSkinOpacity });
            this.drawSingleFrame(nextFrame, { alpha: this.onionSkinOpacity });
        }

        this.drawSingleFrame(this.project.frames[this.currentFrameIndex]);
        this.drawGrid();
    }

    drawSingleFrame(frameData, options = {}) {
        if (!frameData) return;
        const originalAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = options.alpha || 1.0;
        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                if (frameData[y][x]) {
                    this.ctx.fillStyle = frameData[y][x];
                    this.ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        this.ctx.globalAlpha = originalAlpha;
    }

    drawGrid() {
        if (!this.gridEnabled) return;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1 / (this.canvas.clientWidth / this.canvas.width);
        this.ctx.beginPath();
        for (let x = 0; x <= this.canvas.width; x++) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for (let y = 0; y <= this.canvas.height; y++) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();
    }

    drawPixel(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, 1, 1);
    }

    addEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleDraw(e, 'move'));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.handleDraw(e, 'down');
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    floodFill(startX, startY) {
        const frame = this.project.frames[this.currentFrameIndex];
        const targetColor = frame[startY][startX];
        const fillColor = this.getCurrentColor();

        if (targetColor === fillColor) return false;

        const queue = [[startX, startY]];
        const visited = new Set([`${startX},${startY}`]);
        const width = this.canvas.width;
        const height = this.canvas.height;

        frame[startY][startX] = fillColor;

        while (queue.length > 0) {
            const [x, y] = queue.shift();

            const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
            for (const [nx, ny] of neighbors) {
                const key = `${nx},${ny}`;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(key) && frame[ny][nx] === targetColor) {
                    visited.add(key);
                    frame[ny][nx] = fillColor;
                    queue.push([nx, ny]);
                }
            }
        }
        return true;
    }

    handleDraw(e, eventType) {
        if (!this.project) return;
        if (eventType === 'move' && !this.isDrawing) return;

        const { gridX, gridY } = this.getCanvasCoordinates(e);
        if (gridX < 0 || gridX >= this.canvas.width || gridY < 0 || gridY >= this.canvas.height) return;

        switch (this.currentTool) {
            case 'pencil': {
                const color = this.getCurrentColor();
                if (this.project.frames[this.currentFrameIndex][gridY][gridX] !== color) {
                    this.project.frames[this.currentFrameIndex][gridY][gridX] = color;
                    this.drawPixel(gridX, gridY, color); // Optimized draw
                    this.project.updatedAt = new Date().toISOString();
                    this.project.isDirty = true;
                }
                break;
            }
            case 'eraser': {
                if (this.project.frames[this.currentFrameIndex][gridY][gridX] !== null) {
                    this.project.frames[this.currentFrameIndex][gridY][gridX] = null;
                    this.project.updatedAt = new Date().toISOString();
                    this.project.isDirty = true;
                    this.render(); // Full render for eraser
                }
                break;
            }
            case 'fill': {
                if (eventType === 'down') {
                    if (this.floodFill(gridX, gridY)) {
                        this.project.updatedAt = new Date().toISOString();
                        this.project.isDirty = true;
                        this.render(); // Full render for fill
                    }
                }
                break;
            }
            case 'color-picker': {
                if (eventType === 'down') {
                    const color = this.project.frames[this.currentFrameIndex][gridY][gridX];
                    if (color) {
                        this.canvas.dispatchEvent(new CustomEvent('colorpicked', { detail: { color } }));
                    }
                    this.setTool(this.previousTool);
                    this.canvas.dispatchEvent(new CustomEvent('toolswitched', { detail: { tool: this.previousTool } }));
                }
                break;
            }
        }
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        return { gridX: Math.floor(canvasX), gridY: Math.floor(canvasY) };
    }

    getCurrentColor() {
        const activeSwatch = document.querySelector('#color-palette-container .color-swatch.active');
        return activeSwatch ? activeSwatch.dataset.color : '#000000';
    }
}

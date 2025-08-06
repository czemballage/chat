async function exportToPngZip(project, scale) {
    const zip = new JSZip();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = project.canvasSize.width * scale;
    canvas.height = project.canvasSize.height * scale;

    const statusEl = document.getElementById('exportStatus');

    for (let i = 0; i < project.frames.length; i++) {
        statusEl.textContent = `Processing frame ${i + 1} of ${project.frames.length}...`;
        const frameData = project.frames[i];
        drawScaledFrame(ctx, frameData, project.canvasSize, scale);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        zip.file(`frame_${String(i + 1).padStart(4, '0')}.png`, blob);
    }

    statusEl.textContent = 'Zipping files...';
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    statusEl.textContent = 'Done!';
    return zipBlob;
}

function exportToGif(project, scale, options) {
    return new Promise((resolve, reject) => {
        const gif = new GIF({
            workers: 2,
            quality: 10,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
            repeat: options.loop ? 0 : -1,
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = project.canvasSize.width * scale;
        canvas.height = project.canvasSize.height * scale;

        const statusEl = document.getElementById('exportStatus');

        for (let i = 0; i < project.frames.length; i++) {
            const frameData = project.frames[i];
            drawScaledFrame(ctx, frameData, project.canvasSize, scale, options.transparent);
            gif.addFrame(ctx, { copy: true, delay: 1000 / project.fps });
        }

        gif.on('finished', (blob) => {
            statusEl.textContent = 'Done!';
            resolve(blob);
        });

        gif.on('progress', (p) => {
            statusEl.textContent = `Rendering GIF: ${Math.round(p * 100)}%`;
        });

        gif.render();
    });
}

function drawScaledFrame(ctx, frameData, canvasSize, scale, isTransparent = false) {
    if (!isTransparent) {
        ctx.fillStyle = '#ffffff'; // Default to white background
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    for (let y = 0; y < canvasSize.height; y++) {
        for (let x = 0; x < canvasSize.width; x++) {
            if (frameData[y][x]) {
                ctx.fillStyle = frameData[y][x];
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

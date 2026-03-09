document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('downloadForm');
    const urlInput = document.getElementById('videoUrl');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    const downloadBtn = document.getElementById('downloadBtn');

    // === قم بتغيير هذا الرابط إلى رابط Railway بعد رفع الباك إند ===
    // مثال: const BACKEND_URL = 'https://your-app-name.up.railway.app';
    const BACKEND_URL = 'https://ryan-gold-production.up.railway.app';
    // ===============================================================

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = urlInput.value.trim();
        if (!url) return;

        // UI updates to show loading state
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        downloadBtn.disabled = true;
        downloadBtn.style.opacity = '0.8';
        downloadBtn.style.cursor = 'not-allowed';

        try {
            // Send request to Flask backend
            const response = await fetch(`${BACKEND_URL}/api/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'حدث خطأ أثناء معالجة الطلب');
            }

            // Get filename from Content-Disposition header if possible
            let filename = 'video.mp4';
            const disposition = response.headers.get('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                    // Decode from UTF-8 if encoded
                    try {
                        filename = decodeURIComponent(escape(filename));
                    } catch (e) { }
                }
            }

            // Convert response to Blob
            const blob = await response.blob();

            // Create object URL and download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = filename;

            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();

            showCustomAlert('تم تجهيز الفيديو بنجاح! بدأ التنزيل...', 'success');
            urlInput.value = '';

        } catch (error) {
            console.error('Download error:', error);
            showCustomAlert(error.message, 'error');
        } finally {
            // Revert UI to normal
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
            downloadBtn.style.cursor = 'pointer';
        }
    });

    function showCustomAlert(message, type = 'success') {
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = 'custom-alert';

        const iconColor = type === 'success' ? '#4cd137' : '#e84118';
        const iconClass = type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark';

        alertDiv.innerHTML = `
            <i class="fa-solid ${iconClass}" style="color: ${iconColor}; margin-left: 10px; font-size: 1.2rem;"></i>
            <span>${message}</span>
        `;

        Object.assign(alertDiv.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-20px)',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(15px)',
            border: `1px solid ${type === 'success' ? 'rgba(76, 209, 55, 0.3)' : 'rgba(232, 65, 24, 0.3)'}`,
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            opacity: '0',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: '1000',
            fontFamily: "'Cairo', sans-serif"
        });

        document.body.appendChild(alertDiv);

        requestAnimationFrame(() => {
            alertDiv.style.opacity = '1';
            alertDiv.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => alertDiv.remove(), 400);
        }, 4000);
    }
});

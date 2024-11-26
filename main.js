$(document).ready(function() {
    const photoWall = $('#photo-wall');
    const photoUpload = $('#photo-upload');
    const floatingHeartsContainer = $('#floating-hearts');
    let photos = JSON.parse(localStorage.getItem('photos') || '[]');

    // 转换旧数据格式
    photos = photos.map(photo => {
        if (typeof photo === 'string') {
            return {
                url: photo,
                timestamp: Date.now(),
                description: 'A beautiful moment'
            };
        }
        return photo;
    });
    localStorage.setItem('photos', JSON.stringify(photos));

    // 设置编辑密码（你可以修改这个密码）
    const EDIT_PASSWORD = '123456';

    // 当前编辑的照片索引
    let currentEditIndex = -1;

    // 渲染照片时添加编辑按钮
    function renderPhoto(photo, index) {
        return `
            <div class="photo-item animate__animated animate__fadeIn">
                <div class="edit-overlay">
                    <button class="edit-btn" onclick="startEdit(${index})">
                        <svg viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                </div>
                <img src="${photo.url}" alt="${photo.description || ''}" onclick="showLightbox(${index})">
                <div class="photo-info">
                    <h3>${photo.description || 'Our Photo'}</h3>
                    <p>${new Date(photo.timestamp).toLocaleDateString()}</p>
                </div>
            </div>
        `;
    }

    // 开始编辑照片
    window.startEdit = function(index) {
        currentEditIndex = index;
        const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
        passwordModal.show();
    };

    // 显示大图
    window.showLightbox = function(index) {
        const photos = JSON.parse(localStorage.getItem('photos') || '[]');
        if (index >= 0 && index < photos.length) {
            const photo = photos[index];
            // 这里可以实现大图预览功能
        }
    };

    // 验证密码
    document.getElementById('verifyPassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('editPassword');
        const password = passwordInput.value;
        
        if (password === EDIT_PASSWORD) {
            // 密码正确
            const passwordModal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
            passwordModal.hide();
            
            // 显示编辑模态框
            showEditModal();
            
            // 清除密码输入
            passwordInput.value = '';
            passwordInput.classList.remove('is-invalid');
        } else {
            // 密码错误
            passwordInput.classList.add('is-invalid');
            document.querySelector('#passwordModal .modal-content').classList.add('password-shake');
            setTimeout(() => {
                document.querySelector('#passwordModal .modal-content').classList.remove('password-shake');
            }, 500);
        }
    });

    // 显示编辑模态框
    function showEditModal() {
        const photos = JSON.parse(localStorage.getItem('photos') || '[]');
        if (currentEditIndex >= 0 && currentEditIndex < photos.length) {
            const photo = photos[currentEditIndex];
            
            // 填充表单
            document.getElementById('editPhotoTitle').value = photo.description || '';
            document.getElementById('editPhotoDate').value = new Date(photo.timestamp).toISOString().split('T')[0];
            document.getElementById('editPhotoDescription').value = photo.description || '';
            document.getElementById('editPhotoIndex').value = currentEditIndex;
            
            // 显示模态框
            new bootstrap.Modal(document.getElementById('editPhotoModal')).show();
        }
    }

    // 保存编辑
    document.getElementById('saveEditPhoto').addEventListener('click', async function() {
        const photos = JSON.parse(localStorage.getItem('photos') || '[]');
        if (currentEditIndex >= 0 && currentEditIndex < photos.length) {
            const imageInput = document.getElementById('editPhotoImage');
            const photo = photos[currentEditIndex];
            
            // 更新文本内容
            photo.description = document.getElementById('editPhotoTitle').value;
            photo.timestamp = new Date(document.getElementById('editPhotoDate').value).getTime();
            
            // 如果上传了新图片，更新图片
            if (imageInput.files && imageInput.files[0]) {
                const imageFile = imageInput.files[0];
                const imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(imageFile);
                });
                photo.url = imageUrl;
            }
            
            // 保存到localStorage
            localStorage.setItem('photos', JSON.stringify(photos));
            
            // 关闭模态框并刷新显示
            bootstrap.Modal.getInstance(document.getElementById('editPhotoModal')).hide();
            loadSavedPhotos();
        }
    });

    // 删除照片
    document.getElementById('deletePhoto').addEventListener('click', function() {
        new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
    });

    // 确认删除
    document.getElementById('confirmDelete').addEventListener('click', function() {
        const photos = JSON.parse(localStorage.getItem('photos') || '[]');
        if (currentEditIndex >= 0 && currentEditIndex < photos.length) {
            // 删除照片
            photos.splice(currentEditIndex, 1);
            localStorage.setItem('photos', JSON.stringify(photos));
            
            // 关闭所有模态框
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('editPhotoModal')).hide();
            
            // 刷新显示
            loadSavedPhotos();
        }
    });

    // 清除密码输入框的错误状态
    document.getElementById('passwordModal').addEventListener('hidden.bs.modal', function() {
        document.getElementById('editPassword').classList.remove('is-invalid');
    });

    // 加载保存的照片
    function loadSavedPhotos() {
        const photos = JSON.parse(localStorage.getItem('photos') || '[]');
        photoWall.empty();
        photos.forEach((photo, index) => {
            const photoHtml = renderPhoto(photo, index);
            photoWall.append(photoHtml);
        });
    }

    // 上传照片
    photoUpload.on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const newPhoto = {
                    url: e.target.result,
                    timestamp: Date.now(),
                    description: ''
                };

                const photos = JSON.parse(localStorage.getItem('photos') || '[]');
                photos.push(newPhoto);
                localStorage.setItem('photos', JSON.stringify(photos));
                loadSavedPhotos();
            };
            reader.readAsDataURL(file);
        }
    });

    // 创建浮动爱心
    function createFloatingHeart() {
        const heart = $('<div>').addClass('floating-heart').html('❤️');
        heart.css({
            left: Math.random() * 100 + '%',
            animationDuration: Math.random() * 2 + 3 + 's'
        });
        floatingHeartsContainer.append(heart);
        setTimeout(() => heart.remove(), 5000);
    }

    // 定期创建浮动爱心
    setInterval(createFloatingHeart, 2000);

    // 初始化加载照片
    loadSavedPhotos();
});

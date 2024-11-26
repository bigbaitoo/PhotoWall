$(document).ready(function() {
    const timeline = $('#timeline');
    let photos = JSON.parse(localStorage.getItem('photos') || '[]');
    
    // 为每张照片添加时间戳（如果没有的话）
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

    // 按时间排序
    photos.sort((a, b) => b.timestamp - a.timestamp);

    // 设置编辑密码（确保和照片墙页面使用相同的密码）
    const EDIT_PASSWORD = '123456';

    // 当前编辑的照片索引
    let currentEditIndex = -1;

    // 初始化 Bootstrap 提示框
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 渲染时光轴
    function renderTimeline() {
        // 按时间排序
        photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        timeline.empty();
        photos.forEach((photo, index) => {
            const isLeft = index % 2 === 0;
            timeline.append(renderTimelineItem(photo, index, isLeft));
        });

        // 初始化 Lightbox
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true,
            'albumLabel': "第 %1 张 / 共 %2 张"
        });
    }

    // 渲染单个时光轴项目
    function renderTimelineItem(photo, index, isLeft) {
        const date = moment(photo.timestamp).format('YYYY年MM月DD日');
        return `
            <div class="timeline-item ${isLeft ? 'left' : 'right'} animate__animated animate__fadeIn">
                <div class="timeline-content">
                    <div class="edit-overlay">
                        <button class="edit-btn" onclick="startEdit(${index})" data-bs-toggle="tooltip" title="编辑">
                            <svg viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="timeline-img">
                        <a href="${photo.url}" data-lightbox="timeline" data-title="${photo.description || ''}">
                            <img src="${photo.url}" alt="${photo.description || '时光记忆'}">
                        </a>
                    </div>
                    <div class="timeline-text">
                        <h3>${photo.description || '美好时刻'}</h3>
                        <p class="date">${date}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // 开始编辑
    window.startEdit = function(index) {
        currentEditIndex = index;
        const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
        passwordModal.show();
    }

    // 验证密码
    $('#verifyPassword').click(function() {
        const passwordInput = $('#editPassword');
        const password = passwordInput.value;
        
        if (password === EDIT_PASSWORD) {
            // 密码正确
            const passwordModal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
            passwordModal.hide();
            
            // 显示编辑模态框
            showEditModal();
            
            // 清除密码输入
            passwordInput.val('');
            passwordInput.removeClass('is-invalid');
        } else {
            // 密码错误
            passwordInput.addClass('is-invalid');
            $('.modal-content').addClass('password-shake');
            setTimeout(() => {
                $('.modal-content').removeClass('password-shake');
            }, 500);
        }
    });

    // 显示编辑模态框
    function showEditModal() {
        if (currentEditIndex >= 0 && currentEditIndex < photos.length) {
            const photo = photos[currentEditIndex];
            
            // 填充表单
            $('#editPhotoTitle').val(photo.description || '');
            $('#editPhotoDate').val(moment(photo.timestamp).format('YYYY-MM-DD'));
            $('#editPhotoIndex').val(currentEditIndex);
            
            // 显示模态框
            new bootstrap.Modal(document.getElementById('editPhotoModal')).show();
        }
    }

    // 保存编辑
    $('#saveEditPhoto').click(async function() {
        const index = parseInt($('#editPhotoIndex').val());
        if (index >= 0 && index < photos.length) {
            const photo = photos[index];
            
            // 更新照片信息
            photo.description = $('#editPhotoTitle').val();
            photo.timestamp = new Date($('#editPhotoDate').val()).getTime();
            
            // 处理新上传的图片
            const imageFile = $('#editPhotoFile')[0].files[0];
            if (imageFile) {
                const imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(imageFile);
                });
                photo.url = imageUrl;
            }
            
            // 保存到 localStorage
            localStorage.setItem('photos', JSON.stringify(photos));
            
            // 关闭模态框
            bootstrap.Modal.getInstance(document.getElementById('editPhotoModal')).hide();
            
            // 重新渲染时光轴
            renderTimeline();
        }
    });

    // 删除照片
    $('#deletePhoto').click(function() {
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        deleteModal.show();
    });

    // 确认删除
    $('#confirmDelete').click(function() {
        if (currentEditIndex >= 0 && currentEditIndex < photos.length) {
            // 删除照片
            photos.splice(currentEditIndex, 1);
            
            // 保存到 localStorage
            localStorage.setItem('photos', JSON.stringify(photos));
            
            // 关闭所有模态框
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('editPhotoModal')).hide();
            
            // 重新渲染时光轴
            renderTimeline();
        }
    });

    // 监听照片更新
    window.addEventListener('storage', function(e) {
        if (e.key === 'photos') {
            photos = JSON.parse(e.newValue || '[]');
            renderTimeline();
        }
    });

    // 初始渲染
    renderTimeline();
});

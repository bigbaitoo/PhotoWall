$(document).ready(function() {
    const heartWall = $('#heart-wall');
    let photos = JSON.parse(localStorage.getItem('photos') || '[]');
    const EDIT_PASSWORD = '123456';
    let currentEditIndex = -1;

    // 初始化工具提示
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 生成爱心形状的坐标
    function generateHeartCoordinates(size) {
        const coordinates = [];
        const centerX = size / 2;
        const centerY = size / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // 将坐标转换到 -2 到 2 的范围
                const px = (2 * (x - centerX)) / size;
                const py = (2 * (y - centerY)) / size;
                
                // 爱心方程
                // (x²+y²-1)³ - x²y³ = 0
                const isInHeart = Math.pow((Math.pow(px, 2) + Math.pow(py, 2) - 1), 3) - 
                                Math.pow(px, 2) * Math.pow(py, 3) <= 0;
                
                if (isInHeart) {
                    coordinates.push({x: x, y: y});
                }
            }
        }
        
        return coordinates;
    }

    // 渲染照片墙
    function renderPhotoWall() {
        const gridSize = 8; // 8x8 网格
        const coordinates = generateHeartCoordinates(gridSize);
        heartWall.empty();

        // 确保有足够的照片填满爱心
        while (photos.length < coordinates.length) {
            photos = photos.concat(photos);
        }

        // 随机打乱照片顺序
        const shuffledPhotos = [...photos].sort(() => Math.random() - 0.5);

        // 为每个坐标创建照片项
        coordinates.forEach((coord, index) => {
            if (index < shuffledPhotos.length) {
                const photo = shuffledPhotos[index];
                const photoItem = createPhotoItem(photo, index, coord, gridSize);
                heartWall.append(photoItem);
            }
        });

        // 初始化 Lightbox
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true,
            'albumLabel': "第 %1 张 / 共 %2 张"
        });
    }

    // 创建单个照片项
    function createPhotoItem(photo, index, coord, gridSize) {
        return `
            <div class="photo-item" style="left: ${(coord.x / gridSize) * 100}%; top: ${(coord.y / gridSize) * 100}%;">
                <div class="photo-content">
                    <div class="edit-overlay">
                        <button class="edit-btn" onclick="startEdit(${index})" data-bs-toggle="tooltip" title="编辑">
                            <svg viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                    </div>
                    <a href="${photo.url}" data-lightbox="heart-wall" data-title="${photo.description || ''}">
                        <img src="${photo.url}" alt="${photo.description || '爱的记忆'}">
                    </a>
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
        const password = passwordInput.val();
        
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
            
            // 重新渲染照片墙
            renderPhotoWall();
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
            
            // 重新渲染照片墙
            renderPhotoWall();
        }
    });

    // 监听照片更新
    window.addEventListener('storage', function(e) {
        if (e.key === 'photos') {
            photos = JSON.parse(e.newValue || '[]');
            renderPhotoWall();
        }
    });

    // 初始渲染
    renderPhotoWall();
});

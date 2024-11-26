$(document).ready(function() {
    const EDIT_PASSWORD = '123456';
    let photos = JSON.parse(localStorage.getItem('photos') || '[]');
    let currentEditIndex = -1;
    let currentSeason = 'spring';

    // 季节音乐列表
    const seasonMusic = {
        spring: {
            name: '春日私语',
            artist: 'Bandari',
            url: 'https://music.163.com/song/media/outer/url?id=139377.mp3',
            cover: 'https://p2.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'
        },
        summer: {
            name: '夏日清晨',
            artist: 'Bandari',
            url: 'https://music.163.com/song/media/outer/url?id=139378.mp3',
            cover: 'https://p2.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'
        },
        autumn: {
            name: '秋日思念',
            artist: 'Bandari',
            url: 'https://music.163.com/song/media/outer/url?id=139379.mp3',
            cover: 'https://p2.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'
        },
        winter: {
            name: '冬日恋歌',
            artist: 'Bandari',
            url: 'https://music.163.com/song/media/outer/url?id=139380.mp3',
            cover: 'https://p2.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'
        }
    };

    // 初始化音乐播放器
    const ap = new APlayer({
        container: document.getElementById('music-player'),
        fixed: true,
        mini: true,
        autoplay: true,
        loop: 'all',
        volume: 0.7,
        audio: [seasonMusic.spring]
    });

    // 生成场景动画元素
    function generateSceneElements() {
        const scenes = {
            spring: { selector: '.cherry-blossom', count: 10, emoji: '🌸' },
            summer: { selector: '.sunshine', count: 3, emoji: '☀️' },
            autumn: { selector: '.falling-leaves', count: 10, emoji: '🍁' },
            winter: { selector: '.snowfall', count: 15, emoji: '❄' }
        };

        Object.entries(scenes).forEach(([season, config]) => {
            const container = document.querySelector(config.selector);
            container.innerHTML = '';
            
            for (let i = 0; i < config.count; i++) {
                const element = document.createElement('div');
                element.textContent = config.emoji;
                element.style.position = 'absolute';
                element.style.left = `${Math.random() * 100}%`;
                element.style.animationDelay = `${Math.random() * 5}s`;
                element.style.animationDuration = `${5 + Math.random() * 10}s`;
                container.appendChild(element);
            }
        });
    }

    // 切换季节
    function changeSeason(season) {
        if (currentSeason === season) return;

        // 更新按钮状态
        $('.btn-season').removeClass('active');
        $(`.btn-season[data-season="${season}"]`).addClass('active');

        // 更新场景
        $('.season').removeClass('active');
        $(`.${season}-scene`).addClass('active');

        // 更新音乐
        ap.list.clear();
        ap.list.add(seasonMusic[season]);
        ap.play();

        currentSeason = season;
        renderPhotos();
    }

    // 渲染照片
    function renderPhotos() {
        const seasonPhotos = photos.filter(photo => {
            const photoDate = new Date(photo.timestamp);
            const month = photoDate.getMonth();
            
            switch(currentSeason) {
                case 'spring': return month >= 2 && month <= 4;
                case 'summer': return month >= 5 && month <= 7;
                case 'autumn': return month >= 8 && month <= 10;
                case 'winter': return month === 11 || month <= 1;
                default: return true;
            }
        });

        const container = $(`#${currentSeason}-photos`);
        container.empty();

        seasonPhotos.forEach((photo, index) => {
            const photoElement = $(`
                <div class="photo-item animate__animated animate__fadeIn">
                    <div class="photo-content">
                        <div class="edit-overlay">
                            <button class="edit-btn" onclick="startEdit(${index})" data-bs-toggle="tooltip" title="编辑">
                                <svg viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                        </div>
                        <a href="${photo.url}" data-lightbox="season-photos" data-title="${photo.description || ''}">
                            <img src="${photo.url}" alt="${photo.description || '美好时光'}">
                        </a>
                    </div>
                </div>
            `);
            container.append(photoElement);
        });

        // 初始化工具提示
        $('[data-bs-toggle="tooltip"]').tooltip();

        // 初始化 Lightbox
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true,
            'albumLabel': "第 %1 张 / 共 %2 张"
        });
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
            const passwordModal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
            passwordModal.hide();
            showEditModal();
            passwordInput.val('');
            passwordInput.removeClass('is-invalid');
        } else {
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
            
            $('#editPhotoTitle').val(photo.description || '');
            $('#editPhotoDate').val(moment(photo.timestamp).format('YYYY-MM-DD'));
            $('#editPhotoIndex').val(currentEditIndex);
            
            new bootstrap.Modal(document.getElementById('editPhotoModal')).show();
        }
    }

    // 保存编辑
    $('#saveEditPhoto').click(async function() {
        const index = parseInt($('#editPhotoIndex').val());
        if (index >= 0 && index < photos.length) {
            const photo = photos[index];
            
            photo.description = $('#editPhotoTitle').val();
            photo.timestamp = new Date($('#editPhotoDate').val()).getTime();
            
            const imageFile = $('#editPhotoFile')[0].files[0];
            if (imageFile) {
                const imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(imageFile);
                });
                photo.url = imageUrl;
            }
            
            localStorage.setItem('photos', JSON.stringify(photos));
            bootstrap.Modal.getInstance(document.getElementById('editPhotoModal')).hide();
            renderPhotos();
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
            photos.splice(currentEditIndex, 1);
            localStorage.setItem('photos', JSON.stringify(photos));
            
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('editPhotoModal')).hide();
            
            renderPhotos();
        }
    });

    // 监听季节切换按钮
    $('.btn-season').click(function() {
        const season = $(this).data('season');
        changeSeason(season);
    });

    // 监听照片更新
    window.addEventListener('storage', function(e) {
        if (e.key === 'photos') {
            photos = JSON.parse(e.newValue || '[]');
            renderPhotos();
        }
    });

    // 初始化
    generateSceneElements();
    renderPhotos();
});

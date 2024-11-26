$(document).ready(function() {
    let currentPage = 0;
    let currentEditIndex = -1;
    let stories = JSON.parse(localStorage.getItem('stories') || '[]');
    const storySlides = $('.story-slides');
    const prevBtn = $('.prev-btn');
    const nextBtn = $('.next-btn');
    const progressBar = $('.progress-bar');

    // 更新进度条
    function updateProgress() {
        const progress = ((currentPage + 1) / stories.length) * 100;
        progressBar.css('width', `${progress}%`);
        const totalStories = stories.length;
        if (totalStories > 0) {
            document.querySelector('.progress-text').textContent = `${currentPage + 1} / ${totalStories}`;
        } else {
            document.querySelector('.progress-text').textContent = '0 / 0';
        }
    }

    // 更新导航按钮状态
    function updateNavButtons() {
        prevBtn.prop('disabled', currentPage === 0);
        nextBtn.prop('disabled', currentPage === stories.length - 1);
    }

    // 创建故事页面
    function createStoryPage(story, index) {
        const page = $('<div>').addClass('story-page');
        if (index === 0) page.addClass('active');

        const card = $('<div>').addClass('story-card animate-fade-in');
        
        // 图片部分
        const imageDiv = $('<div>').addClass('story-image');
        const img = $('<img>').attr('src', story.image);
        imageDiv.append(img);

        // 文字部分
        const textDiv = $('<div>').addClass('story-text');
        const date = $('<div>').addClass('story-date').text(story.date);
        const title = $('<h2>').addClass('story-title').text(story.title);
        const description = $('<p>').addClass('story-description').text(story.text);

        textDiv.append(date, title, description);
        card.append(imageDiv, textDiv);
        page.append(card);

        return page;
    }

    // 初始化故事页面
    function initStoryPages() {
        storySlides.empty();
        if (stories.length === 0) {
            const emptyMessage = $('<div>').addClass('story-page active')
                .append($('<div>').addClass('story-card animate-fade-in')
                    .append($('<h2>').addClass('story-title text-center')
                        .text('开始记录你们的故事吧！')));
            storySlides.append(emptyMessage);
            nextBtn.prop('disabled', true);
            return;
        }

        stories.forEach((story, index) => {
            const page = createStoryPage(story, index);
            storySlides.append(page);
        });

        updateProgress();
        updateNavButtons();
    }

    // 切换页面
    function changePage(direction) {
        const pages = $('.story-page');
        pages.eq(currentPage).removeClass('active');
        
        currentPage += direction;
        
        pages.eq(currentPage).addClass('active');
        updateProgress();
        updateNavButtons();
    }

    // 添加新故事
    function addNewStory(story) {
        stories.push(story);
        localStorage.setItem('stories', JSON.stringify(stories));
        initStoryPages();
        // 自动跳转到新故事
        if (currentPage !== stories.length - 1) {
            while (currentPage < stories.length - 1) {
                changePage(1);
            }
        }
    }

    // 编辑故事
    document.querySelector('.edit-btn').addEventListener('click', () => {
        if (currentPage >= 0 && currentPage < stories.length) {
            currentEditIndex = currentPage;
            const story = stories[currentPage];
            
            // 填充表单
            document.getElementById('editStoryTitle').value = story.title;
            document.getElementById('editStoryDate').value = story.date;
            document.getElementById('editStoryText').value = story.text;
            document.getElementById('editStoryIndex').value = currentPage;
            
            // 显示模态框
            new bootstrap.Modal(document.getElementById('editStoryModal')).show();
        }
    });

    // 保存编辑
    document.getElementById('saveEditStory').addEventListener('click', async () => {
        if (currentEditIndex >= 0 && currentEditIndex < stories.length) {
            const imageInput = document.getElementById('editStoryImage');
            const story = stories[currentEditIndex];
            
            // 更新文本内容
            story.title = document.getElementById('editStoryTitle').value;
            story.date = document.getElementById('editStoryDate').value;
            story.text = document.getElementById('editStoryText').value;
            
            // 如果上传了新图片，更新图片
            if (imageInput.files && imageInput.files[0]) {
                const imageFile = imageInput.files[0];
                const imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(imageFile);
                });
                story.image = imageUrl;
            }
            
            // 保存到localStorage
            localStorage.setItem('stories', JSON.stringify(stories));
            
            // 关闭模态框并刷新显示
            bootstrap.Modal.getInstance(document.getElementById('editStoryModal')).hide();
            initStoryPages();
        }
    });

    // 删除故事
    document.querySelector('.delete-btn').addEventListener('click', () => {
        if (currentPage >= 0) {
            new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
        }
    });

    // 确认删除
    document.getElementById('confirmDelete').addEventListener('click', () => {
        if (currentPage >= 0 && currentPage < stories.length) {
            // 删除当前故事
            stories.splice(currentPage, 1);
            localStorage.setItem('stories', JSON.stringify(stories));
            
            // 关闭模态框
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            
            // 如果还有故事，显示上一个故事，否则返回第一个
            if (stories.length > 0) {
                currentPage = Math.max(0, currentPage - 1);
                initStoryPages();
            } else {
                // 如果没有故事了，显示空状态
                document.querySelector('.story-container').innerHTML = `
                    <div class="empty-state">
                        <h3>还没有故事呢</h3>
                        <p>点击右下角的"+"按钮添加你的第一个故事吧！</p>
                    </div>
                `;
            }
            
            // 更新进度显示
            updateProgress();
        }
    });

    // 事件监听
    prevBtn.on('click', () => changePage(-1));
    nextBtn.on('click', () => changePage(1));

    // 键盘导航
    $(document).on('keydown', function(e) {
        if (e.key === 'ArrowLeft' && !prevBtn.prop('disabled')) {
            changePage(-1);
        } else if (e.key === 'ArrowRight' && !nextBtn.prop('disabled')) {
            changePage(1);
        }
    });

    // 处理故事提交
    $('#saveStory').on('click', function() {
        const imageFile = $('#storyImage')[0].files[0];
        const title = $('#storyTitle').val();
        const date = $('#storyDate').val();
        const text = $('#storyText').val();

        if (!imageFile || !title || !date || !text) {
            alert('请填写所有必填项！');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const story = {
                image: e.target.result,
                title: title,
                date: new Date(date).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                text: text,
                timestamp: new Date(date).getTime()
            };

            addNewStory(story);
            $('#addStoryModal').modal('hide');
            $('#storyForm')[0].reset();
        };
        reader.readAsDataURL(imageFile);
    });

    // 添加触摸滑动支持
    let touchStartX = 0;
    let touchEndX = 0;

    $('.story-content').on('touchstart', function(e) {
        touchStartX = e.originalEvent.touches[0].clientX;
    });

    $('.story-content').on('touchend', function(e) {
        touchEndX = e.originalEvent.changedTouches[0].clientX;
        const difference = touchStartX - touchEndX;

        if (Math.abs(difference) > 50) { // 最小滑动距离
            if (difference > 0 && currentPage < stories.length - 1) {
                // 向左滑动，下一页
                changePage(1);
            } else if (difference < 0 && currentPage > 0) {
                // 向右滑动，上一页
                changePage(-1);
            }
        }
    });

    // 初始化页面
    initStoryPages();
});

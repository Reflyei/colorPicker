// background.js（后台脚本）
chrome.commands.onCommand.addListener((command) => {
    if (command === 'capture_color') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getPosition' }, (position) => {
                chrome.tabs.captureVisibleTab({ format: 'png' }, function (dataUrl) {
                    if (chrome.runtime.lastError) {
                        console.error("截图错误:", chrome.runtime.lastError.message);
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'showError',
                            message: '截图错误'
                        });
                        return;
                    }
                    // 先检查标签页是否存在且已加载完成
                    chrome.tabs.get(tabs[0].id, function (tab) {
                        if (chrome.runtime.lastError || !tab) {
                            console.error("标签页不存在:", chrome.runtime.lastError?.message);
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'showError',
                                message: '标签页不存在'
                            });
                            return;
                        }
                        // 检查页面是否已完全加载
                        if (tab.status !== 'complete') {
                            console.error("页面未完全加载");
                            // 发送消息给 content script 显示错误提示
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'showError',
                                message: '页面未完全加载'
                            });
                            return;
                        }
                        // 发送消息给指定标签页
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'processCapture',
                            dataUrl,
                            x: position.x,
                            y: position.y
                        }, function (response) {
                            if (chrome.runtime.lastError) {
                                console.error("消息处理错误:", chrome.runtime.lastError.message);
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: 'showError',
                                    message: '消息处理错误'
                                });
                                return;
                            }
                            if (response && response.success) {
                                console.log('颜色获取成功');
                            } else if (response && !response.success) {
                                console.error('颜色获取失败:', response.error);
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: 'showError',
                                    message: '颜色获取失败'
                                });
                            }
                        });
                    });
                });
            });
        });
    }
});
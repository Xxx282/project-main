import { App } from 'antd';

// 导出 antd 的 useApp hook
// 使用方式：在组件中 const { message } = useApp()
// 替代直接 import { message } from 'antd'
export const { useApp, message, notification } = App;

import { message, notification } from 'antd';

/**
 * API unificada de feedback (toast) usando Ant Design.
 * Use toast em vez de message/notification direto para padrão consistente.
 */
export const toast = {
  success(text, description) {
    if (description) {
      notification.success({ message: text, description, placement: 'bottomRight' });
    } else {
      message.success(text);
    }
  },
  error(text, description) {
    if (description) {
      notification.error({ message: text, description, placement: 'bottomRight' });
    } else {
      message.error(text);
    }
  },
  warning(text, description) {
    if (description) {
      notification.warning({ message: text, description, placement: 'bottomRight' });
    } else {
      message.warning(text);
    }
  },
  info(text, description) {
    if (description) {
      notification.info({ message: text, description, placement: 'bottomRight' });
    } else {
      message.info(text);
    }
  },
};

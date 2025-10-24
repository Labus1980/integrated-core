import { useEffect, useRef } from 'react';

export const useZammadChat = () => {
  const initialized = useRef(false);

  useEffect(() => {
    // Предотвращаем двойную инициализацию в React StrictMode
    if (initialized.current) return;
    
    // Проверяем, что скрипт загружен и ZammadChat доступен
    if (typeof window !== 'undefined' && (window as any).ZammadChat) {
      try {
        new (window as any).ZammadChat({
          fontSize: '12px',
          chatId: 1, // ID твоего чата из Zammad
          debug: true,
          show: false, // Открывать чат только по кнопке
          title: '<strong>Поддержка</strong>', // Заголовок чата
          inactiveClass: 'is-inactive',
          buttonClass: 'open-zammad-chat'
        });
        initialized.current = true;
        console.log('Zammad chat initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Zammad chat:', error);
      }
    } else {
      console.warn('ZammadChat not found. Make sure the script is loaded.');
    }
  }, []);
};

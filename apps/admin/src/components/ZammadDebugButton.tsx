import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Bug } from 'lucide-react';

declare global {
  interface Window {
    ZammadChat?: any;
    zammadChat?: any;
    openZammadChat?: () => void;
  }
}

/**
 * Тестовая кнопка для диагностики Zammad чата
 * Выводит подробные логи для отладки
 */
export const ZammadDebugButton: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [chatReady, setChatReady] = useState(false);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    const log = `[${timestamp}] ${emoji} ${message}`;
    console.log(log);
    setLogs(prev => [...prev, log]);
  };

  const checkZammadStatus = () => {
    addLog('=== ПРОВЕРКА СТАТУСА ZAMMAD ===', 'info');

    // Проверка скрипта
    if (typeof window.ZammadChat === 'undefined') {
      addLog('ZammadChat НЕ ЗАГРУЖЕН! Проверьте <script> в index.html', 'error');
    } else {
      addLog('ZammadChat загружен в window', 'success');
      addLog(`Тип: ${typeof window.ZammadChat}`, 'info');

      // Проверяем доступные методы
      if (window.ZammadChat.init) {
        addLog('Метод ZammadChat.init() доступен', 'success');
      } else {
        addLog('Метод ZammadChat.init() НЕ НАЙДЕН', 'error');
      }

      if (window.ZammadChat.open) {
        addLog('Метод ZammadChat.open() доступен', 'success');
      } else {
        addLog('Метод ZammadChat.open() НЕ НАЙДЕН', 'error');
      }
    }

    // Проверка экземпляра
    if (window.zammadChat) {
      addLog('window.zammadChat существует', 'success');
      addLog(`Тип: ${typeof window.zammadChat}`, 'info');
      setChatReady(true);

      // Проверяем методы экземпляра
      if (window.zammadChat.open) {
        addLog('Метод zammadChat.open() доступен', 'success');
      } else {
        addLog('Метод zammadChat.open() НЕ НАЙДЕН', 'error');
      }
    } else {
      addLog('window.zammadChat НЕ СОЗДАН', 'error');
      setChatReady(false);
    }

    // Проверка глобальной функции
    if (window.openZammadChat) {
      addLog('window.openZammadChat() доступна', 'success');
    } else {
      addLog('window.openZammadChat() НЕ НАЙДЕНА', 'error');
    }

    // Проверка кнопок в DOM
    const buttons = document.querySelectorAll('.open-zammad-chat, .zammad-chat-button');
    addLog(`Найдено кнопок чата в DOM: ${buttons.length}`, buttons.length > 0 ? 'success' : 'error');
    buttons.forEach((btn, idx) => {
      addLog(`  Кнопка ${idx + 1}: ${btn.className}`, 'info');
    });

    addLog('=== КОНЕЦ ПРОВЕРКИ ===', 'info');
  };

  const tryOpenChat = () => {
    addLog('=== ПОПЫТКА ОТКРЫТЬ ЧАТ ===', 'info');

    // Метод 1: через window.openZammadChat()
    if (window.openZammadChat) {
      try {
        addLog('Вызов window.openZammadChat()...', 'info');
        window.openZammadChat();
        addLog('window.openZammadChat() выполнен', 'success');
      } catch (err) {
        addLog(`Ошибка window.openZammadChat(): ${err}`, 'error');
      }
      return;
    }

    // Метод 2: напрямую через window.zammadChat.open()
    if (window.zammadChat && typeof window.zammadChat.open === 'function') {
      try {
        addLog('Вызов window.zammadChat.open()...', 'info');
        window.zammadChat.open();
        addLog('window.zammadChat.open() выполнен', 'success');
      } catch (err) {
        addLog(`Ошибка window.zammadChat.open(): ${err}`, 'error');
      }
      return;
    }

    // Метод 3: клик по кнопке
    const btn = document.querySelector('.open-zammad-chat, .zammad-chat-button') as HTMLElement;
    if (btn) {
      try {
        addLog('Клик по кнопке .open-zammad-chat...', 'info');
        btn.click();
        addLog('Клик выполнен', 'success');
      } catch (err) {
        addLog(`Ошибка клика: ${err}`, 'error');
      }
      return;
    }

    addLog('ВСЕ МЕТОДЫ ОТКРЫТИЯ НЕДОСТУПНЫ!', 'error');
  };

  const testWebSocket = () => {
    addLog('=== ТЕСТ WEBSOCKET СОЕДИНЕНИЯ ===', 'info');

    try {
      addLog('Попытка подключения к wss://zammad.okta-solutions.com/ws', 'info');
      const ws = new WebSocket('wss://zammad.okta-solutions.com/ws');

      ws.onopen = () => {
        addLog('✅ WebSocket соединение УСТАНОВЛЕНО!', 'success');
        ws.close();
      };

      ws.onerror = (error) => {
        addLog(`❌ WebSocket ошибка: ${error}`, 'error');
      };

      ws.onclose = (event) => {
        addLog(`WebSocket закрыт. Код: ${event.code}, Причина: ${event.reason || 'не указана'}`, 'info');
      };

      // Таймаут 5 секунд
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          addLog('❌ Таймаут подключения WebSocket (5 сек)', 'error');
          ws.close();
        }
      }, 5000);
    } catch (error) {
      addLog(`❌ Ошибка создания WebSocket: ${error}`, 'error');
    }
  };

  const forceInitChat = () => {
    addLog('=== ПРИНУДИТЕЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ЧАТА ===', 'info');

    if (!window.ZammadChat) {
      addLog('❌ window.ZammadChat не найден!', 'error');
      return;
    }

    addLog('✅ window.ZammadChat найден', 'success');

    try {
      addLog('Создание нового экземпляра ZammadChat...', 'info');
      const chat = new window.ZammadChat({
        title: 'Поддержка OKTA Solutions',
        fontSize: '12px',
        flat: true,
        chatId: 1,
        host: 'https://zammad.okta-solutions.com',
        wsHost: 'wss://zammad.okta-solutions.com/ws',
        show: false,
        buttonClass: 'open-zammad-chat',
        inactiveClass: 'is-inactive',
        debug: true,
      });

      window.zammadChat = chat;
      addLog('✅ Экземпляр создан и сохранен в window.zammadChat', 'success');

      window.openZammadChat = () => {
        if (chat && typeof chat.open === 'function') {
          chat.open();
        }
      };
      addLog('✅ window.openZammadChat() создана', 'success');

      setChatReady(true);
      addLog('✅✅✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА ✅✅✅', 'success');
    } catch (error) {
      addLog(`❌ Ошибка инициализации: ${error}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Логи очищены', 'info');
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] overflow-hidden flex flex-col z-50 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Диагностика Zammad
        </CardTitle>
        <CardDescription>
          Тестовая панель для проверки чата
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            onClick={checkZammadStatus}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Проверить статус
          </Button>
          <Button
            onClick={tryOpenChat}
            variant="default"
            size="sm"
            className="flex-1"
            disabled={!chatReady}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Открыть чат
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testWebSocket}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            Тест WebSocket
          </Button>
          <Button
            onClick={forceInitChat}
            variant="destructive"
            size="sm"
            className="flex-1"
          >
            Принудительный Init
          </Button>
        </div>

        <Button
          onClick={clearLogs}
          variant="ghost"
          size="sm"
        >
          Очистить логи
        </Button>

        <div className="mt-2 p-2 bg-black text-green-400 text-xs font-mono rounded max-h-[400px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Нажмите "Проверить статус" для диагностики</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="mb-1 whitespace-pre-wrap break-all">
                {log}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ZammadDebugButton;

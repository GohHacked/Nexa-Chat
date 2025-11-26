
import React from 'react';
import { ThemeMode } from '../types';
import { IconChevronLeft, IconBook, IconLock } from '../components/Icons';

interface InfoPageProps {
  onBack: () => void;
  theme: ThemeMode;
  type: 'rules' | 'privacy';
}

const InfoPage: React.FC<InfoPageProps> = ({ onBack, theme, type }) => {
  const isDark = theme === 'dark';
  const bgBase = isDark ? 'bg-black text-white' : 'bg-white text-gray-900';
  const textSub = isDark ? 'text-neutral-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-neutral-900/50' : 'bg-gray-50';

  const title = type === 'rules' ? 'Правила пользования' : 'Политика конфиденциальности';
  const Icon = type === 'rules' ? IconBook : IconLock;

  return (
    <div className={`flex flex-col h-full w-full max-w-2xl mx-auto ${bgBase} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center p-4 border-b sticky top-0 z-10 backdrop-blur-md ${isDark ? 'border-neutral-800 bg-black/80' : 'border-gray-200 bg-white/80'}`}>
        <button onClick={onBack} className={`p-2 rounded-full mr-4 ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}>
          <IconChevronLeft className="w-6 h-6" />
        </button>
        <div>
            <h1 className="text-lg font-bold flex items-center">
               {title}
            </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-20">
        <div className="mb-8 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${isDark ? 'bg-red-900/20 text-red-600' : 'bg-red-50 text-red-600'}`}>
                <Icon className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-2">{title}</h2>
            <p className={`text-sm ${textSub}`}>Последнее обновление: {new Date().toLocaleDateString()}</p>
        </div>

        <div className={`p-6 rounded-3xl ${cardBg} space-y-6 text-sm leading-relaxed`}>
            {type === 'rules' ? (
                <>
                    <section>
                        <h3 className="font-bold text-lg mb-2 text-red-600">1. Уважение</h3>
                        <p className={textSub}>Мы создаем безопасное и дружелюбное сообщество. Любые формы оскорблений, дискриминации, языка вражды или буллинга строго запрещены. Нарушители будут забанены без предупреждения.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg mb-2 text-red-600">2. Контент</h3>
                        <p className={textSub}>Запрещена рассылка спама, вредоносных ссылок, порнографии, а также контента, нарушающего законодательство. NexaChat оставляет за собой право удалять такой контент.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg mb-2 text-red-600">3. Безопасность</h3>
                        <p className={textSub}>Не передавайте свои пароли третьим лицам. Администрация никогда не запрашивает ваш пароль. Сообщайте о любых подозрительных действиях в поддержку.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg mb-2 text-red-600">4. Использование ИИ</h3>
                        <p className={textSub}>При общении с ботами запрещено использовать промпты, направленные на генерацию незаконного или вредоносного контента.</p>
                    </section>
                </>
            ) : (
                <>
                    <section>
                        <h3 className="font-bold text-lg mb-2 text-red-600">1. Хранение данных</h3>
                        <p className={textSub}>NexaChat (в данной версии) использует локальное хранилище вашего устройства (LocalStorage). Мы не передаем ваши сообщения на внешние серверы, кроме случаев взаимодействия с ИИ-моделями.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg mb-2 text-red-600">2. Взаимодействие с ИИ</h3>
                        <p className={textSub}>Для работы чат-ботов сообщения отправляются в Google Gemini API. Эти данные используются только для генерации ответа и не используются для обучения моделей Google.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg mb-2 text-red-600">3. Ваши права</h3>
                        <p className={textSub}>Вы имеете право в любой момент удалить все свои данные, воспользовавшись кнопкой "Сброс данных" в настройках. Это безвозвратно удалит всю историю переписки и аккаунт с устройства.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-lg mb-2 text-red-600">4. Cookie и отслеживание</h3>
                        <p className={textSub}>Мы не используем сторонние трекеры или рекламные cookie.</p>
                    </section>
                </>
            )}
        </div>
        
        <div className="mt-8 text-center">
            <p className={`text-xs ${textSub}`}>NexaChat Inc. &copy; 2025</p>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;

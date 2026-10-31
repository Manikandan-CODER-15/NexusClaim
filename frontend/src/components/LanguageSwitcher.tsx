import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="flex items-center space-x-1 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-sm">
      <Globe size={15} className="text-gray-500" />
      <select
        value={i18n.language || 'en'}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent border-none text-gray-700 dark:text-gray-200 outline-none text-sm cursor-pointer"
      >
        <option value="en">EN</option>
        <option value="ta">தமிழ்</option>
        <option value="hi">हिन्दी</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;


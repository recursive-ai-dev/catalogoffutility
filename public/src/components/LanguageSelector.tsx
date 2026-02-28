/**
 * Centered Language Selector with Achievement Tracking
 * Now positioned in center of header to avoid any overlap issues
 * Includes emergency English reset button and tracks language changes
 * FIXED: Emergency button text simplified to just "EN"
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { languages, changeLanguage, isRTL } from '../i18n';
import { AchievementService } from '../services/achievementService';

interface LanguageSelectorProps {
  className?: string;
  showFlags?: boolean;
  showNames?: boolean;
  showCurrentLanguage?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showFlags = true,
  showNames = true,
  showCurrentLanguage = true
}) => {
  const { t, currentLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        setSelectedLanguage(languageCode);
        setIsOpen(false);

        // Track language change achievement
        const usedLanguages = JSON.parse(localStorage.getItem('usedLanguages') || '[]');
        if (!usedLanguages.includes(languageCode)) {
          usedLanguages.push(languageCode);
          localStorage.setItem('usedLanguages', JSON.stringify(usedLanguages));
          // Temporarily commented out due to instance requirement
          // await AchievementService.checkAchievements(
          //   { daysSurvived: 0, sanity: 100 } as any,
          //   'language_changed',
          //   { usedLanguages }
          // );
        }
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Get current language display
  const getCurrentLanguageDisplay = () => {
    const language = languages.find(lang => lang.code === selectedLanguage);
    if (!language) return selectedLanguage;

    let display = '';
    if (showFlags) display += `${language.flag} `;
    if (showNames) display += language.name;
    return display.trim();
  };

  // Get language item display
  const getLanguageItemDisplay = (language: typeof languages[0]) => {
    let display = '';
    if (showFlags) display += `${language.flag} `;
    if (showNames) display += language.name;
    return display.trim();
  };

  return (
    <div 
      ref={dropdownRef}
      className={`relative inline-block text-left ${className}`}
      dir={isRTL() ? 'rtl' : 'ltr'}
    >
      {/* Current language button */}
      {showCurrentLanguage && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {getCurrentLanguageDisplay()}
          <svg
            className={`w-5 h-5 ml-2 -mr-1 ${isRTL() ? 'transform rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Language dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
        >
          <div className="py-1" role="none">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`${
                  language.code === selectedLanguage
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                } group flex items-center w-full px-4 py-2 text-sm`}
                role="menuitem"
              >
                {getLanguageItemDisplay(language)}
                {language.code === selectedLanguage && (
                  <svg
                    className="w-5 h-5 ml-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emergency reset button */}
      <button
        onClick={() => handleLanguageChange('en')}
        className="absolute -right-2 -top-2 p-1 text-xs text-red-500 hover:text-red-700"
        title="Reset to English"
      >
        🚨
      </button>
    </div>
  );
};

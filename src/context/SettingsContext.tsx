import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';
type Language = 'pt' | 'en';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  
  // Novas configurações de chat
  textSize: number;
  setTextSize: (size: number) => void;
  bubbleRadius: number;
  setBubbleRadius: (radius: number) => void;
  chatListView: 'two' | 'three';
  setChatListView: (view: 'two' | 'three') => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  internalBrowser: boolean;
  setInternalBrowser: (enabled: boolean) => void;
  raiseToListen: boolean;
  setRaiseToListen: (enabled: boolean) => void;
  pauseOnRecording: boolean;
  setPauseOnRecording: (enabled: boolean) => void;
  sendWithEnter: boolean;
  setSendWithEnter: (enabled: boolean) => void;
  distanceUnit: 'automatic' | 'metric' | 'imperial';
  setDistanceUnit: (unit: 'automatic' | 'metric' | 'imperial') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
  const [language, setLanguageState] = useState<Language>('pt');
  const [menuVisible, setMenuVisible] = useState(false);

  // Estados das novas configurações
  const [textSize, setTextSizeState] = useState(17);
  const [bubbleRadius, setBubbleRadiusState] = useState(17);
  const [chatListView, setChatListViewState] = useState<'two' | 'three'>('two');
  const [animationsEnabled, setAnimationsEnabledState] = useState(true);
  const [internalBrowser, setInternalBrowserState] = useState(true);
  const [raiseToListen, setRaiseToListenState] = useState(true);
  const [pauseOnRecording, setPauseOnRecordingState] = useState(true);
  const [sendWithEnter, setSendWithEnterState] = useState(false);
  const [distanceUnit, setDistanceUnitState] = useState<'automatic' | 'metric' | 'imperial'>('automatic');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      const savedLang = await AsyncStorage.getItem('app_lang');
      const s_textSize = await AsyncStorage.getItem('app_text_size');
      const s_bubbleRadius = await AsyncStorage.getItem('app_bubble_radius');
      const s_chatListView = await AsyncStorage.getItem('app_chat_list_view');
      const s_animations = await AsyncStorage.getItem('app_animations');
      const s_browser = await AsyncStorage.getItem('app_internal_browser');
      const s_raise = await AsyncStorage.getItem('app_raise_to_listen');
      const s_pause = await AsyncStorage.getItem('app_pause_on_recording');
      const s_enter = await AsyncStorage.getItem('app_send_with_enter');
      const s_unit = await AsyncStorage.getItem('app_distance_unit');

      if (savedTheme) setTheme(savedTheme as Theme);
      if (savedLang) setLanguageState(savedLang as Language);
      if (s_textSize) setTextSizeState(parseInt(s_textSize, 10));
      if (s_bubbleRadius) setBubbleRadiusState(parseInt(s_bubbleRadius, 10));
      if (s_chatListView) setChatListViewState(s_chatListView as 'two' | 'three');
      if (s_animations) setAnimationsEnabledState(s_animations === 'true');
      if (s_browser) setInternalBrowserState(s_browser === 'true');
      if (s_raise) setRaiseToListenState(s_raise === 'true');
      if (s_pause) setPauseOnRecordingState(s_pause === 'true');
      if (s_enter) setSendWithEnterState(s_enter === 'true');
      if (s_unit) setDistanceUnitState(s_unit as 'automatic' | 'metric' | 'imperial');
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('app_theme', newTheme);
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('app_lang', lang);
  };

  // Funções de Setter
  const setTextSize = async (size: number) => {
    setTextSizeState(size);
    await AsyncStorage.setItem('app_text_size', String(size));
  };

  const setBubbleRadius = async (radius: number) => {
    setBubbleRadiusState(radius);
    await AsyncStorage.setItem('app_bubble_radius', String(radius));
  };

  const setChatListView = async (view: 'two' | 'three') => {
    setChatListViewState(view);
    await AsyncStorage.setItem('app_chat_list_view', view);
  };

  const setAnimationsEnabled = async (enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    await AsyncStorage.setItem('app_animations', String(enabled));
  };

  const setInternalBrowser = async (enabled: boolean) => {
    setInternalBrowserState(enabled);
    await AsyncStorage.setItem('app_internal_browser', String(enabled));
  };

  const setRaiseToListen = async (enabled: boolean) => {
    setRaiseToListenState(enabled);
    await AsyncStorage.setItem('app_raise_to_listen', String(enabled));
  };

  const setPauseOnRecording = async (enabled: boolean) => {
    setPauseOnRecordingState(enabled);
    await AsyncStorage.setItem('app_pause_on_recording', String(enabled));
  };

  const setSendWithEnter = async (enabled: boolean) => {
    setSendWithEnterState(enabled);
    await AsyncStorage.setItem('app_send_with_enter', String(enabled));
  };

  const setDistanceUnit = async (unit: 'automatic' | 'metric' | 'imperial') => {
    setDistanceUnitState(unit);
    await AsyncStorage.setItem('app_distance_unit', unit);
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        theme, language, toggleTheme, setLanguage, menuVisible, setMenuVisible,
        textSize, setTextSize,
        bubbleRadius, setBubbleRadius,
        chatListView, setChatListView,
        animationsEnabled, setAnimationsEnabled,
        internalBrowser, setInternalBrowser,
        raiseToListen, setRaiseToListen,
        pauseOnRecording, setPauseOnRecording,
        sendWithEnter, setSendWithEnter,
        distanceUnit, setDistanceUnit
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
}

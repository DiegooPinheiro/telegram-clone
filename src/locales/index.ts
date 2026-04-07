import { useSettings } from '../context/SettingsContext';

const locales = {
  pt: {
    tabs: {
      chats: 'Conversas',
      contacts: 'Contatos',
      settings: 'Configurações',
      profile: 'Perfil'
    },
    settings: {
      account: 'Conta',
      accountSub: 'Número, Nome de Usuário, Bio',
      chatSettings: 'Configurações de Chat',
      chatSettingsSub: 'Papel de Parede, Modo Noturno, Animações',
      privacy: 'Privacidade e Segurança',
      privacySub: 'Visto por Último, Dispositivos, Chaves de Acesso',
      notifications: 'Notificações',
      notificationsSub: 'Sons, Chamadas, Contadores',
      data: 'Dados e Armazenamento',
      dataSub: 'Opções de download de mídia',
      devices: 'Dispositivos',
      devicesSub: 'Gerenciar dispositivos conectados',
      language: 'Idioma',
      languageSub: 'Português (Brasil)',
      deleteAccount: 'Deletar sua conta',
      logout: 'Sair da Conta',
      noName: 'Sem nome'
    }
  },
  en: {
    tabs: {
      chats: 'Chats',
      contacts: 'Contacts',
      settings: 'Settings',
      profile: 'Profile'
    },
    settings: {
      account: 'Account',
      accountSub: 'Number, Username, Bio',
      chatSettings: 'Chat Settings',
      chatSettingsSub: 'Wallpaper, Dark Mode, Animations',
      privacy: 'Privacy and Security',
      privacySub: 'Last Seen, Devices, Access Keys',
      notifications: 'Notifications',
      notificationsSub: 'Sounds, Calls, Counters',
      data: 'Data and Storage',
      dataSub: 'Media download options',
      devices: 'Devices',
      devicesSub: 'Manage connected devices',
      language: 'Language',
      languageSub: 'English',
      deleteAccount: 'Delete your account',
      logout: 'Log Out',
      noName: 'No name'
    }
  }
};

export const useTranslation = () => {
  const { language } = useSettings();
  
  const t = (path: string) => {
    const keys = path.split('.');
    let result: any = locales[language as keyof typeof locales] || locales['pt'];
    
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path; // Fallback to raw path if translation is missing
      }
    }
    return result as string;
  };

  return { t };
};

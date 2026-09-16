export type SupportedLanguage = "es" | "en" | "pt";

export interface TranslationsDict {
  nav: {
    logoSubtitle: string;
    explore: string;
    event: string;
    write: string;
    searchPlaceholder: string;
    notifications: string;
    markAllAsRead: string;
    all: string;
    unread: string;
    noNotifications: string;
    noNotificationsDesc: string;
    closePanel: string;
    myProfile: string;
    myInventory: string;
    myLibrary: string;
    visualTheme: string;
    settings: string;
    creatorPanel: string;
    logout: string;
    wallet: string;
    level: string;
    newBadge: string;
    login: string;
    register: string;
  };
  dashboard: {
    welcomeBack: string;
    studioBadge: string;
    heroSubtitle: string;
    readingsInProgress: string;
    authorsInCommunity: string;
    levelInfo: string;
    exploreCatalog: string;
    whatsNew: string;
    continueReading: string;
    continueReadingSubtitle: string;
    myLibraryLink: string;
    activeCommunity: string;
    authorsOnline: string;
    noReadings: string;
    noReadingsDesc: string;
    startReading: string;
    recentStories: string;
    popularStories: string;
    chapter: string;
    publishedChapters: string;
    publishedStories: string;
    registeredAuthors: string;
  };
  settingsModal: {
    title: string;
    subtitle: string;
    tabThemes: string;
    tabPerformance: string;
    tabLanguages: string;
    tabReading: string;
    tabPrivacy: string;
    tabGeneral?: string;
    tabSecurity?: string;
    themeTitle: string;
    themeDesc: string;
    lowSpecTitle: string;
    lowSpecDesc: string;
    lowSpecActive: string;
    reducedMotionTitle: string;
    reducedMotionDesc: string;
    ambientEffectsTitle: string;
    ambientEffectsDesc: string;
    clearCacheButton: string;
    interfaceLanguage: string;
    interfaceLanguageDesc: string;
    storyLanguage: string;
    storyLanguageDesc: string;
    allStories: string;
    allStoriesDesc: string;
    matureContentTitle: string;
    matureContentDesc: string;
    readerFontSizeTitle: string;
    readerFontSizeDesc: string;
    onlineStatusTitle: string;
    onlineStatusDesc: string;
    dataSecurityTitle: string;
    dataSecurityDesc: string;
    synced: string;
    saveAndClose: string;
    saveChanges?: string;
    close?: string;
    clearCacheTitle?: string;
    clearCacheDesc?: string;
  };
  footer: {
    brandDesc: string;
    createdBy: string;
    exploration: string;
    catalog: string;
    writingWorkshop: string;
    myLibrary: string;
    authorDashboard: string;
    events?: string;
    rules: string;
    communityRules: string;
    publishingGuidelines: string;
    rightsAndOriginality: string;
    contactUs: string;
    contactDesc: string;
    privacyPolicy?: string;
    termsOfService?: string;
    resources?: string;
    helpCenter?: string;
    about?: string;
    developedBy: string;
    allRightsReserved: string;
    madeWithHeart: string;
    andDigitalInk: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    confirm: string;
    success: string;
    error: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationsDict> = {
  es: {
    nav: {
      logoSubtitle: "Historias sin límite",
      explore: "Explorar",
      event: "Evento",
      write: "Escribir",
      searchPlaceholder: "Buscar historias, autores, etiquetas...",
      notifications: "Notificaciones",
      markAllAsRead: "Marcar leídas",
      all: "Todas",
      unread: "Sin leer",
      noNotifications: "No tienes notificaciones",
      noNotificationsDesc: "Te avisaremos cuando alguien te siga, comente, vote o guarde tu historia.",
      closePanel: "Cerrar panel",
      myProfile: "Mi Perfil",
      myInventory: "Mi Inventario",
      myLibrary: "Mi Biblioteca",
      visualTheme: "Tema Visual",
      settings: "Ajustes",
      creatorPanel: "Panel Creador",
      logout: "Cerrar Sesión",
      wallet: "Billetera",
      level: "Nivel",
      newBadge: "Nuevo",
      login: "Iniciar Sesión",
      register: "Registrarse",
    },
    dashboard: {
      welcomeBack: "¡Hola de vuelta, {name}!",
      studioBadge: "Estudio Literario FicNation",
      heroSubtitle: "Descubre mundos originales, continúa leyendo tus historias pendientes o redacta nuevos capítulos en tu taller creativo.",
      readingsInProgress: "{count} lecturas en progreso",
      authorsInCommunity: "{count} autores en comunidad",
      levelInfo: "Nivel {level}",
      exploreCatalog: "Explorar Catálogo",
      whatsNew: "Novedades v2.4",
      continueReading: "Continuar Leyendo",
      continueReadingSubtitle: "Retoma tus novelas justo donde las dejaste",
      myLibraryLink: "Mi biblioteca",
      activeCommunity: "Comunidad Activa",
      authorsOnline: "Autores y lectores en línea",
      noReadings: "Aún no tienes lecturas iniciadas",
      noReadingsDesc: "Explora miles de fanfics y novelas originales para comenzar a leer.",
      startReading: "Comenzar a Leer",
      recentStories: "Historias Recientes",
      popularStories: "Más Populares",
      chapter: "Capítulo",
      publishedChapters: "Capítulos disponibles",
      publishedStories: "Historias publicadas",
      registeredAuthors: "Autores registrados",
    },
    settingsModal: {
      title: "Ajustes & Preferencias",
      subtitle: "Configura tu experiencia visual y personal en FicNation",
      tabThemes: "Temas Visuales",
      tabPerformance: "Rendimiento",
      tabLanguages: "Idiomas",
      tabReading: "Lectura & Filtros",
      tabPrivacy: "Privacidad",
      tabGeneral: "General & Apariencia",
      tabSecurity: "Seguridad & Datos",
      themeTitle: "Paleta y Tema Global de la Página",
      themeDesc: "Personaliza la atmósfera visual de toda la plataforma con 4 estilos optimizados.",
      lowSpecTitle: "Modo PC de Bajos Recursos",
      lowSpecDesc: "Elimina desenfoques pesados (backdrop-blur) y animaciones continuas para garantizar máxima fluidez en portátiles o equipos de bajos recursos.",
      lowSpecActive: "ACTIVO",
      reducedMotionTitle: "Animaciones Reducidas",
      reducedMotionDesc: "Pausa efectos de flotación y transiciones lentas para una navegación instantánea.",
      ambientEffectsTitle: "Resplandores de Fondo",
      ambientEffectsDesc: "Muestra u oculta los efectos ambientales suaves que adornan las esquinas de la pantalla.",
      clearCacheButton: "Optimizar & Limpiar Memoria Caché Local",
      clearCacheTitle: "Limpiar Caché Local",
      clearCacheDesc: "Elimina borradores temporales y datos en caché del navegador.",
      interfaceLanguage: "Idioma de la Interfaz",
      interfaceLanguageDesc: "Selecciona el idioma principal de navegación, menús y textos de la plataforma.",
      storyLanguage: "Idioma de Historias Buscadas & Catálogo",
      storyLanguageDesc: "Filtra automáticamente los resultados de búsqueda y recomendaciones según el idioma de escritura.",
      allStories: "Todos",
      allStoriesDesc: "Multilingüe",
      matureContentTitle: "Filtro de Contenido Maduro & NSFW",
      matureContentDesc: "Permite visualizar historias con temáticas oscuras, complejas, violencia o romance maduro en el catálogo y explorador.",
      readerFontSizeTitle: "Tamaño de Letra en Lector de Capítulos",
      readerFontSizeDesc: "Establece el tamaño predeterminado del texto al abrir cualquier capítulo.",
      onlineStatusTitle: "Mostrar Estado en Línea en la Comunidad",
      onlineStatusDesc: "Permite que otros autores vean tu presencia activa en la comunidad en tiempo real.",
      dataSecurityTitle: "Seguridad de Datos & Cuenta",
      dataSecurityDesc: "Tus preferencias se guardan de forma segura y se sincronizan instantáneamente en tu navegador con respaldo en la nube de FicNation por F4Studios.",
      synced: "Preferencias sincronizadas",
      saveAndClose: "Guardar & Cerrar",
      saveChanges: "Guardar Cambios",
      close: "Cerrar",
    },
    footer: {
      brandDesc: "El universo digital donde lectores y autores dan vida a historias originales, fanfics y mundos inmersivos.",
      createdBy: "Creado por",
      exploration: "Exploración",
      catalog: "Catálogo de Historias",
      writingWorkshop: "Taller de Escritura",
      myLibrary: "Mi Biblioteca",
      authorDashboard: "Dashboard de Autor",
      events: "Eventos Literarios",
      rules: "Normas & Reglas",
      communityRules: "Reglas de la Comunidad",
      publishingGuidelines: "Directrices de Publicación",
      rightsAndOriginality: "Derechos y Originalidad",
      contactUs: "Contáctanos",
      contactDesc: "¿Tienes dudas, sugerencias o quieres colaborar con nosotros? Encuéntranos en nuestras redes:",
      privacyPolicy: "Política de Privacidad",
      termsOfService: "Términos de Servicio",
      resources: "Recursos",
      helpCenter: "Centro de Ayuda",
      about: "Acerca de FicNation",
      developedBy: "Desarrollado con pasión por",
      allRightsReserved: "Todos los derechos de las obras pertenecen a sus respectivos autores.",
      madeWithHeart: "Hecho para amantes de la literatura con",
      andDigitalInk: "y tinta digital.",
    },
    common: {
      loading: "Cargando...",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      back: "Volver",
      confirm: "Confirmar",
      success: "Operación realizada con éxito",
      error: "Ocurrió un error inesperado",
    },
  },
  en: {
    nav: {
      logoSubtitle: "Limitless stories",
      explore: "Explore",
      event: "Event",
      write: "Write",
      searchPlaceholder: "Search stories, authors, tags...",
      notifications: "Notifications",
      markAllAsRead: "Mark as read",
      all: "All",
      unread: "Unread",
      noNotifications: "No notifications",
      noNotificationsDesc: "We'll notify you when someone follows you, comments, votes, or saves your story.",
      closePanel: "Close panel",
      myProfile: "My Profile",
      myInventory: "My Inventory",
      myLibrary: "My Library",
      visualTheme: "Visual Theme",
      settings: "Settings",
      creatorPanel: "Creator Panel",
      logout: "Log Out",
      wallet: "Wallet",
      level: "Level",
      newBadge: "New",
      login: "Log In",
      register: "Sign Up",
    },
    dashboard: {
      welcomeBack: "Welcome back, {name}!",
      studioBadge: "FicNation Literary Studio",
      heroSubtitle: "Discover original worlds, continue reading your pending stories, or write new chapters in your creative workshop.",
      readingsInProgress: "{count} readings in progress",
      authorsInCommunity: "{count} authors in community",
      levelInfo: "Level {level}",
      exploreCatalog: "Explore Catalog",
      whatsNew: "What's New v2.4",
      continueReading: "Continue Reading",
      continueReadingSubtitle: "Pick up your novels right where you left off",
      myLibraryLink: "My library",
      activeCommunity: "Active Community",
      authorsOnline: "Authors & readers online",
      noReadings: "No active readings yet",
      noReadingsDesc: "Explore thousands of fanfics and original novels to start reading.",
      startReading: "Start Reading",
      recentStories: "Recent Stories",
      popularStories: "Most Popular",
      chapter: "Chapter",
      publishedChapters: "Available chapters",
      publishedStories: "Published stories",
      registeredAuthors: "Registered authors",
    },
    settingsModal: {
      title: "Settings & Preferences",
      subtitle: "Configure your visual and personal experience on FicNation",
      tabThemes: "Visual Themes",
      tabPerformance: "Performance",
      tabLanguages: "Languages",
      tabReading: "Reading & Filters",
      tabPrivacy: "Privacy",
      tabGeneral: "General & Appearance",
      tabSecurity: "Security & Data",
      themeTitle: "Global Theme & Palette",
      themeDesc: "Customize the platform's visual atmosphere with 4 optimized styles.",
      lowSpecTitle: "Low-Spec PC Mode",
      lowSpecDesc: "Disables heavy blurs (backdrop-blur) and continuous animations to ensure maximum smoothness on modest laptops or PCs.",
      lowSpecActive: "ACTIVE",
      reducedMotionTitle: "Reduced Motion",
      reducedMotionDesc: "Pauses floating effects and slow transitions for instant navigation.",
      ambientEffectsTitle: "Ambient Glows",
      ambientEffectsDesc: "Show or hide soft ambient glow effects adorning the screen corners.",
      clearCacheButton: "Optimize & Clear Local Cache Memory",
      clearCacheTitle: "Clear Local Cache",
      clearCacheDesc: "Deletes temporary drafts and cached browser data.",
      interfaceLanguage: "Interface Language",
      interfaceLanguageDesc: "Select the main language for navigation, menus, and platform text.",
      storyLanguage: "Story Language & Catalog",
      storyLanguageDesc: "Automatically filter search results and recommendations according to the writing language.",
      allStories: "All",
      allStoriesDesc: "Multilingual",
      matureContentTitle: "Mature Content & NSFW Filter",
      matureContentDesc: "Allows viewing stories with dark themes, complex plots, violence, or mature romance in the catalog and explorer.",
      readerFontSizeTitle: "Reader Font Size",
      readerFontSizeDesc: "Sets the default text size when opening any chapter.",
      onlineStatusTitle: "Show Online Status in Community",
      onlineStatusDesc: "Allows other authors to see your active presence in the community in real time.",
      dataSecurityTitle: "Account & Data Security",
      dataSecurityDesc: "Your preferences are securely saved and instantly synced in your browser with FicNation cloud backup by F4Studios.",
      synced: "Preferences synchronized",
      saveAndClose: "Save & Close",
      saveChanges: "Save Changes",
      close: "Close",
    },
    footer: {
      brandDesc: "The digital universe where readers and authors bring original stories, fanfics, and immersive worlds to life.",
      createdBy: "Created by",
      exploration: "Exploration",
      catalog: "Story Catalog",
      writingWorkshop: "Writing Workshop",
      myLibrary: "My Library",
      authorDashboard: "Author Dashboard",
      events: "Literary Events",
      rules: "Rules & Guidelines",
      communityRules: "Community Rules",
      publishingGuidelines: "Publishing Guidelines",
      rightsAndOriginality: "Rights & Originality",
      contactUs: "Contact Us",
      contactDesc: "Have questions, suggestions, or want to collaborate with us? Find us on our socials:",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      resources: "Resources",
      helpCenter: "Help Center",
      about: "About FicNation",
      developedBy: "Developed with passion by",
      allRightsReserved: "All rights to works belong to their respective authors.",
      madeWithHeart: "Crafted for literature lovers with",
      andDigitalInk: "and digital ink.",
    },
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      confirm: "Confirm",
      success: "Operation completed successfully",
      error: "An unexpected error occurred",
    },
  },
  pt: {
    nav: {
      logoSubtitle: "Histórias sem limite",
      explore: "Explorar",
      event: "Evento",
      write: "Escrever",
      searchPlaceholder: "Buscar histórias, autores, tags...",
      notifications: "Notificações",
      markAllAsRead: "Marcar lidas",
      all: "Todas",
      unread: "Não lidas",
      noNotifications: "Sem notificações",
      noNotificationsDesc: "Avisaremos quando alguém te seguir, comentar, votar ou salvar sua história.",
      closePanel: "Fechar painel",
      myProfile: "Meu Perfil",
      myInventory: "Meu Inventário",
      myLibrary: "Minha Biblioteca",
      visualTheme: "Tema Visual",
      settings: "Configurações",
      creatorPanel: "Painel do Criador",
      logout: "Sair",
      wallet: "Carteira",
      level: "Nível",
      newBadge: "Novo",
      login: "Entrar",
      register: "Cadastrar-se",
    },
    dashboard: {
      welcomeBack: "Bem-vindo de volta, {name}!",
      studioBadge: "Estúdio Literário FicNation",
      heroSubtitle: "Descubra mundos originais, continue lendo suas histórias pendentes ou escreva novos capítulos na sua oficina criativa.",
      readingsInProgress: "{count} leituras em andamento",
      authorsInCommunity: "{count} autores na comunidade",
      levelInfo: "Nível {level}",
      exploreCatalog: "Explorar Catálogo",
      whatsNew: "Novidades v2.4",
      continueReading: "Continuar Lendo",
      continueReadingSubtitle: "Retome suas histórias de onde parou",
      myLibraryLink: "Minha biblioteca",
      activeCommunity: "Comunidade Ativa",
      authorsOnline: "Autores e leitores online",
      noReadings: "Nenhuma leitura iniciada ainda",
      noReadingsDesc: "Explore milhares de fanfics e histórias originais para começar a ler.",
      startReading: "Começar a Ler",
      recentStories: "Histórias Recentes",
      popularStories: "Mais Populares",
      chapter: "Capítulo",
      publishedChapters: "Capítulos disponíveis",
      publishedStories: "Histórias publicadas",
      registeredAuthors: "Autores registrados",
    },
    settingsModal: {
      title: "Configurações & Preferências",
      subtitle: "Configure sua experiência visual e pessoal no FicNation",
      tabThemes: "Temas Visuais",
      tabPerformance: "Desempenho",
      tabLanguages: "Idiomas",
      tabReading: "Leitura & Filtros",
      tabPrivacy: "Privacidade",
      tabGeneral: "Geral & Aparência",
      tabSecurity: "Segurança & Dados",
      themeTitle: "Paleta e Tema Global da Página",
      themeDesc: "Personalize a atmosfera visual de toda a plataforma com 4 estilos otimizados.",
      lowSpecTitle: "Modo PC de Baixo Desempenho",
      lowSpecDesc: "Desativa desfoques pesados (backdrop-blur) e animações contínuas para máxima fluidez em notebooks ou PCs modestos.",
      lowSpecActive: "ATIVO",
      reducedMotionTitle: "Animações Reduzidas",
      reducedMotionDesc: "Pausa efeitos de flutuação e transições lentas para uma navegação instantânea.",
      ambientEffectsTitle: "Resplendores de Fundo",
      ambientEffectsDesc: "Exibe ou oculta efeitos ambientais suaves que adornam as bordas da tela.",
      clearCacheButton: "Otimizar & Limpar Memória Cache Local",
      clearCacheTitle: "Limpar Cache Local",
      clearCacheDesc: "Exclui rascunhos temporários e dados em cache do navegador.",
      interfaceLanguage: "Idioma da Interface",
      interfaceLanguageDesc: "Selecione o idioma principal de navegação, menus e textos da plataforma.",
      storyLanguage: "Idioma de Histórias & Catálogo",
      storyLanguageDesc: "Filtre automaticamente resultados de busca e recomendações pelo idioma de escrita.",
      allStories: "Todos",
      allStoriesDesc: "Multilíngue",
      matureContentTitle: "Filtro de Conteúdo Maduro & NSFW",
      matureContentDesc: "Permite ver histórias com temas maduros, tramas complexas, violência ou romance adulto no catálogo e explorador.",
      readerFontSizeTitle: "Tamanho da Fonte no Leitor",
      readerFontSizeDesc: "Define o tamanho padrão do texto ao abrir qualquer capítulo.",
      onlineStatusTitle: "Mostrar Status Online na Comunidade",
      onlineStatusDesc: "Permite que outros autores vejam sua presença ativa na comunidade em tempo real.",
      dataSecurityTitle: "Segurança de Dados & Conta",
      dataSecurityDesc: "Suas preferências são salvas com segurança e sincronizadas instantaneamente no seu navegador com backup na nuvem pelo F4Studios.",
      synced: "Preferências sincronizadas",
      saveAndClose: "Salvar & Fechar",
      saveChanges: "Salvar Alterações",
      close: "Fechar",
    },
    footer: {
      brandDesc: "O universo digital onde leitores e autores dão vida a histórias originais, fanfics e mundos imersivos.",
      createdBy: "Criado por",
      exploration: "Exploração",
      catalog: "Catálogo de Histórias",
      writingWorkshop: "Oficina de Escrita",
      myLibrary: "Minha Biblioteca",
      authorDashboard: "Painel do Autor",
      events: "Eventos Literários",
      rules: "Normas & Regras",
      communityRules: "Regras da Comunidade",
      publishingGuidelines: "Diretrizes de Publicação",
      rightsAndOriginality: "Direitos & Originalidade",
      contactUs: "Fale Conosco",
      contactDesc: "Tem dúvidas, sugestões ou quer colaborar conosco? Encontre-nos nas nossas redes:",
      privacyPolicy: "Política de Privacidade",
      termsOfService: "Termos de Serviço",
      resources: "Recursos",
      helpCenter: "Central de Ajuda",
      about: "Sobre o FicNation",
      developedBy: "Desenvolvido com paixão por",
      allRightsReserved: "Todos os direitos das obras pertencem aos seus respectivos autores.",
      madeWithHeart: "Feito para amantes da literatura com",
      andDigitalInk: "e tinta digital.",
    },
    common: {
      loading: "Carregando...",
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Excluir",
      edit: "Editar",
      back: "Voltar",
      confirm: "Confirmar",
      success: "Operação realizada com sucesso",
      error: "Ocorreu um erro inesperado",
    },
  },
};

/**
 * Función utilitaria para interpolar variables en cadenas de texto
 * Ejemplo: t("dashboard.welcomeBack", { name: "Maikol" }) -> "¡Hola de vuelta, Maikol!"
 */
export function getTranslation(
  lang: SupportedLanguage,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const parts = path.split(".");
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      // Fallback a español si no se encuentra
      let fallback: any = TRANSLATIONS.es;
      for (const fPart of parts) {
        if (fallback && typeof fallback === "object" && fPart in fallback) {
          fallback = fallback[fPart];
        } else {
          return path;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== "string") {
    return path;
  }

  if (!params) {
    return current;
  }

  return current.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

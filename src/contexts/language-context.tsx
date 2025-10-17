import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en-GB' | 'da' | 'sv' | 'no' | 'fr' | 'it';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  'en-GB': {
    // Header
    'app.tagline': 'Aiming to be the best weather app.',
    'header.signIn': 'Sign In',
    
    // Weather
    'weather.welcome': 'Welcome to Rainz',
    'weather.searchLocation': 'Search for a location above or allow location access',
    'weather.failed': 'Failed to load weather data',
    'weather.tryAgain': 'Try Again',
    'weather.demoData': 'Demo Data',
    'weather.demoMessage': 'API keys needed for real data',
    'weather.refresh': 'Refresh',
    'weather.locationCard': 'Location Card',
    'weather.myLocation': 'My Location',
    'weather.checkConnection': 'Please check your connection and try again',
    
    // Weather metrics
    'weather.wind': 'Wind',
    'weather.visibility': 'Visibility',
    'weather.feelsLike': 'Feels like',
    'weather.humidity': 'Humidity',
    'weather.pressure': 'Pressure',
    'weather.uvIndex': 'UV Index',
    
    // Time
    'time.goodMorning': 'Good Morning!',
    'time.dismiss': 'Dismiss',
    'time.today': 'Today',
    'time.tomorrow': 'Tomorrow',
    
    // Settings
    'settings.title': 'Settings',
    'settings.account': 'Account',
    'settings.appearance': 'Appearance',
    'settings.notifications': 'Notifications',
    'settings.language': 'Language',
    'settings.signOut': 'Sign Out',
    'settings.enableNotifications': 'Enable Notifications',
    'settings.testNotification': 'Send Test Notification',
    'settings.cardVisibility': 'Card Visibility',
    'settings.cardOrder': 'Card Order',
    'settings.save': 'Save',
    'settings.customise': 'Customise your weather app experience',
    'settings.temperatureUnits': 'Temperature Units',
    'settings.useCelsius': 'Use Celsius (°C)',
    'settings.currentlyFahrenheit': 'Currently using Fahrenheit (°F)',
    'settings.currentlyCelsius': 'Currently using Celsius (°C)',
    'settings.reset': 'Reset',
    'settings.reloadChanges': 'Reload to activate changes.',
    'settings.languageChanged': 'Language changed',
    'settings.changedTo': 'Changed to',
    
    // Pollen
    'pollen.title': 'Pollen Forecast',
    'pollen.track': 'Track Allergies',
    'pollen.low': 'Low',
    'pollen.moderate': 'Moderate',
    'pollen.high': 'High',
    'pollen.veryHigh': 'Very High',
    'pollen.pollenIndex': 'Pollen Index',
    'pollen.hourlyForecast': '24-Hour Forecast',
    'pollen.tenDayForecast': '10-Day Forecast',
    'pollen.detailedMetrics': 'Detailed Metrics',
    'pollen.userRoutines': 'User Routines',
    
    // Footer
    'footer.dataFrom': 'Data from',
    'footer.disclaimer': 'We are not to be held accountable for any inaccuracies or wrong claims.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.da': 'Dansk',
    'language.sv': 'Svenska',
    'language.no': 'Norsk',
    'language.fr': 'Français',
    'language.it': 'Italiano',
  },
  'da': {
    // Header
    'app.tagline': 'Sigter mod at være den bedste vejr-app.',
    'header.signIn': 'Log Ind',
    
    // Weather
    'weather.welcome': 'Velkommen til Rainz',
    'weather.searchLocation': 'Søg efter en placering ovenfor eller tillad adgang til placering',
    'weather.failed': 'Kunne ikke indlæse vejrdata',
    'weather.tryAgain': 'Prøv Igen',
    'weather.demoData': 'Demo Data',
    'weather.demoMessage': 'API-nøgler nødvendige for reelle data',
    'weather.refresh': 'Opdater',
    'weather.locationCard': 'Placeringskort',
    'weather.myLocation': 'Min Placering',
    'weather.checkConnection': 'Tjek venligst din forbindelse og prøv igen',
    
    // Weather metrics
    'weather.wind': 'Vind',
    'weather.visibility': 'Sigtbarhed',
    'weather.feelsLike': 'Føles som',
    'weather.humidity': 'Luftfugtighed',
    'weather.pressure': 'Tryk',
    'weather.uvIndex': 'UV-indeks',
    
    // Time
    'time.goodMorning': 'God Morgen!',
    'time.dismiss': 'Afvis',
    'time.today': 'I dag',
    'time.tomorrow': 'I morgen',
    
    // Settings
    'settings.title': 'Indstillinger',
    'settings.account': 'Konto',
    'settings.appearance': 'Udseende',
    'settings.notifications': 'Notifikationer',
    'settings.language': 'Sprog',
    'settings.signOut': 'Log Ud',
    'settings.enableNotifications': 'Aktivér Notifikationer',
    'settings.testNotification': 'Send Test Notifikation',
    'settings.cardVisibility': 'Kort Synlighed',
    'settings.cardOrder': 'Kort Rækkefølge',
    'settings.save': 'Gem',
    'settings.customise': 'Tilpas din vejr-app oplevelse',
    'settings.temperatureUnits': 'Temperaturenheder',
    'settings.useCelsius': 'Brug Celsius (°C)',
    'settings.currentlyFahrenheit': 'Bruger i øjeblikket Fahrenheit (°F)',
    'settings.currentlyCelsius': 'Bruger i øjeblikket Celsius (°C)',
    'settings.reset': 'Nulstil',
    'settings.reloadChanges': 'Genindlæs for at aktivere ændringer.',
    'settings.languageChanged': 'Sprog ændret',
    'settings.changedTo': 'Ændret til',
    
    // Pollen
    'pollen.title': 'Pollenprognose',
    'pollen.track': 'Spor Allergier',
    'pollen.low': 'Lav',
    'pollen.moderate': 'Moderat',
    'pollen.high': 'Høj',
    'pollen.veryHigh': 'Meget Høj',
    'pollen.pollenIndex': 'Pollenindeks',
    'pollen.hourlyForecast': '24-Timers Prognose',
    'pollen.tenDayForecast': '10-Dages Prognose',
    'pollen.detailedMetrics': 'Detaljerede Målinger',
    'pollen.userRoutines': 'Brugerrutiner',
    
    // Footer
    'footer.dataFrom': 'Data fra',
    'footer.disclaimer': 'Vi er ikke ansvarlige for unøjagtigheder eller forkerte påstande.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.da': 'Dansk',
    'language.sv': 'Svenska',
    'language.no': 'Norsk',
    'language.fr': 'Français',
    'language.it': 'Italiano',
  },
  'sv': {
    // Header
    'app.tagline': 'Strävar efter att vara den bästa väderappen.',
    'header.signIn': 'Logga In',
    
    // Weather
    'weather.welcome': 'Välkommen till Rainz',
    'weather.searchLocation': 'Sök efter en plats ovan eller tillåt platstillgång',
    'weather.failed': 'Kunde inte ladda väderdata',
    'weather.tryAgain': 'Försök Igen',
    'weather.demoData': 'Demo Data',
    'weather.demoMessage': 'API-nycklar behövs för riktig data',
    'weather.refresh': 'Uppdatera',
    'weather.locationCard': 'Platskort',
    'weather.myLocation': 'Min Plats',
    'weather.checkConnection': 'Vänligen kontrollera din anslutning och försök igen',
    
    // Weather metrics
    'weather.wind': 'Vind',
    'weather.visibility': 'Sikt',
    'weather.feelsLike': 'Känns som',
    'weather.humidity': 'Luftfuktighet',
    'weather.pressure': 'Tryck',
    'weather.uvIndex': 'UV-index',
    
    // Time
    'time.goodMorning': 'God Morgon!',
    'time.dismiss': 'Avfärda',
    'time.today': 'Idag',
    'time.tomorrow': 'Imorgon',
    
    // Settings
    'settings.title': 'Inställningar',
    'settings.account': 'Konto',
    'settings.appearance': 'Utseende',
    'settings.notifications': 'Notifikationer',
    'settings.language': 'Språk',
    'settings.signOut': 'Logga Ut',
    'settings.enableNotifications': 'Aktivera Notifikationer',
    'settings.testNotification': 'Skicka Test Notifikation',
    'settings.cardVisibility': 'Kort Synlighet',
    'settings.cardOrder': 'Kort Ordning',
    'settings.save': 'Spara',
    'settings.customise': 'Anpassa din väderapp-upplevelse',
    'settings.temperatureUnits': 'Temperaturenheter',
    'settings.useCelsius': 'Använd Celsius (°C)',
    'settings.currentlyFahrenheit': 'Använder för närvarande Fahrenheit (°F)',
    'settings.currentlyCelsius': 'Använder för närvarande Celsius (°C)',
    'settings.reset': 'Återställ',
    'settings.reloadChanges': 'Ladda om för att aktivera ändringar.',
    'settings.languageChanged': 'Språk ändrat',
    'settings.changedTo': 'Ändrat till',
    
    // Pollen
    'pollen.title': 'Pollenprognos',
    'pollen.track': 'Spåra Allergier',
    'pollen.low': 'Låg',
    'pollen.moderate': 'Måttlig',
    'pollen.high': 'Hög',
    'pollen.veryHigh': 'Mycket Hög',
    'pollen.pollenIndex': 'Pollenindex',
    'pollen.hourlyForecast': '24-Timmars Prognos',
    'pollen.tenDayForecast': '10-Dagars Prognos',
    'pollen.detailedMetrics': 'Detaljerade Mätningar',
    'pollen.userRoutines': 'Användarrutiner',
    
    // Footer
    'footer.dataFrom': 'Data från',
    'footer.disclaimer': 'Vi ansvarar inte för felaktigheter eller felaktiga påståenden.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.da': 'Dansk',
    'language.sv': 'Svenska',
    'language.no': 'Norsk',
    'language.fr': 'Français',
    'language.it': 'Italiano',
  },
  'no': {
    // Header
    'app.tagline': 'Sikter på å være den beste værappen.',
    'header.signIn': 'Logg Inn',
    
    // Weather
    'weather.welcome': 'Velkommen til Rainz',
    'weather.searchLocation': 'Søk etter en plassering ovenfor eller tillat plasseringstilgang',
    'weather.failed': 'Kunne ikke laste værdata',
    'weather.tryAgain': 'Prøv Igjen',
    'weather.demoData': 'Demo Data',
    'weather.demoMessage': 'API-nøkler nødvendig for ekte data',
    'weather.refresh': 'Oppdater',
    'weather.locationCard': 'Plasseringskort',
    'weather.myLocation': 'Min Plassering',
    'weather.checkConnection': 'Vennligst sjekk tilkoblingen din og prøv igjen',
    
    // Weather metrics
    'weather.wind': 'Vind',
    'weather.visibility': 'Sikt',
    'weather.feelsLike': 'Føles som',
    'weather.humidity': 'Luftfuktighet',
    'weather.pressure': 'Trykk',
    'weather.uvIndex': 'UV-indeks',
    
    // Time
    'time.goodMorning': 'God Morgen!',
    'time.dismiss': 'Avvis',
    'time.today': 'I dag',
    'time.tomorrow': 'I morgen',
    
    // Settings
    'settings.title': 'Innstillinger',
    'settings.account': 'Konto',
    'settings.appearance': 'Utseende',
    'settings.notifications': 'Varsler',
    'settings.language': 'Språk',
    'settings.signOut': 'Logg Ut',
    'settings.enableNotifications': 'Aktiver Varsler',
    'settings.testNotification': 'Send Test Varsel',
    'settings.cardVisibility': 'Kort Synlighet',
    'settings.cardOrder': 'Kort Rekkefølge',
    'settings.save': 'Lagre',
    'settings.customise': 'Tilpass værrapp-opplevelsen din',
    'settings.temperatureUnits': 'Temperaturenheter',
    'settings.useCelsius': 'Bruk Celsius (°C)',
    'settings.currentlyFahrenheit': 'Bruker for øyeblikket Fahrenheit (°F)',
    'settings.currentlyCelsius': 'Bruker for øyeblikket Celsius (°C)',
    'settings.reset': 'Tilbakestill',
    'settings.reloadChanges': 'Last inn på nytt for å aktivere endringer.',
    'settings.languageChanged': 'Språk endret',
    'settings.changedTo': 'Endret til',
    
    // Pollen
    'pollen.title': 'Pollenvarsel',
    'pollen.track': 'Spor Allergier',
    'pollen.low': 'Lav',
    'pollen.moderate': 'Moderat',
    'pollen.high': 'Høy',
    'pollen.veryHigh': 'Veldig Høy',
    'pollen.pollenIndex': 'Pollenindeks',
    'pollen.hourlyForecast': '24-Timers Varsel',
    'pollen.tenDayForecast': '10-Dagers Varsel',
    'pollen.detailedMetrics': 'Detaljerte Målinger',
    'pollen.userRoutines': 'Brukerrutiner',
    
    // Footer
    'footer.dataFrom': 'Data fra',
    'footer.disclaimer': 'Vi er ikke ansvarlige for unøyaktigheter eller feil påstander.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.da': 'Dansk',
    'language.sv': 'Svenska',
    'language.no': 'Norsk',
    'language.fr': 'Français',
    'language.it': 'Italiano',
  },
  'fr': {
    // Header
    'app.tagline': 'Visant à être la meilleure application météo.',
    'header.signIn': 'Se Connecter',
    
    // Weather
    'weather.welcome': 'Bienvenue sur Rainz',
    'weather.searchLocation': 'Recherchez un lieu ci-dessus ou autorisez l\'accès à la localisation',
    'weather.failed': 'Échec du chargement des données météo',
    'weather.tryAgain': 'Réessayer',
    'weather.demoData': 'Données de Démonstration',
    'weather.demoMessage': 'Clés API nécessaires pour les données réelles',
    'weather.refresh': 'Actualiser',
    'weather.locationCard': 'Carte de Localisation',
    'weather.myLocation': 'Ma Position',
    'weather.checkConnection': 'Veuillez vérifier votre connexion et réessayer',
    
    // Weather metrics
    'weather.wind': 'Vent',
    'weather.visibility': 'Visibilité',
    'weather.feelsLike': 'Ressenti',
    'weather.humidity': 'Humidité',
    'weather.pressure': 'Pression',
    'weather.uvIndex': 'Indice UV',
    
    // Time
    'time.goodMorning': 'Bonjour!',
    'time.dismiss': 'Rejeter',
    'time.today': 'Aujourd\'hui',
    'time.tomorrow': 'Demain',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.account': 'Compte',
    'settings.appearance': 'Apparence',
    'settings.notifications': 'Notifications',
    'settings.language': 'Langue',
    'settings.signOut': 'Se Déconnecter',
    'settings.enableNotifications': 'Activer les Notifications',
    'settings.testNotification': 'Envoyer une Notification de Test',
    'settings.cardVisibility': 'Visibilité des Cartes',
    'settings.cardOrder': 'Ordre des Cartes',
    'settings.save': 'Enregistrer',
    'settings.customise': 'Personnalisez votre expérience météo',
    'settings.temperatureUnits': 'Unités de Température',
    'settings.useCelsius': 'Utiliser Celsius (°C)',
    'settings.currentlyFahrenheit': 'Utilise actuellement Fahrenheit (°F)',
    'settings.currentlyCelsius': 'Utilise actuellement Celsius (°C)',
    'settings.reset': 'Réinitialiser',
    'settings.reloadChanges': 'Rechargez pour activer les modifications.',
    'settings.languageChanged': 'Langue modifiée',
    'settings.changedTo': 'Changé en',
    
    // Pollen
    'pollen.title': 'Prévisions Polliniques',
    'pollen.track': 'Suivre les Allergies',
    'pollen.low': 'Faible',
    'pollen.moderate': 'Modéré',
    'pollen.high': 'Élevé',
    'pollen.veryHigh': 'Très Élevé',
    'pollen.pollenIndex': 'Indice Pollinique',
    'pollen.hourlyForecast': 'Prévisions sur 24 Heures',
    'pollen.tenDayForecast': 'Prévisions sur 10 Jours',
    'pollen.detailedMetrics': 'Métriques Détaillées',
    'pollen.userRoutines': 'Routines Utilisateur',
    
    // Footer
    'footer.dataFrom': 'Données de',
    'footer.disclaimer': 'Nous ne sommes pas responsables des inexactitudes ou des fausses déclarations.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.da': 'Dansk',
    'language.sv': 'Svenska',
    'language.no': 'Norsk',
    'language.fr': 'Français',
    'language.it': 'Italiano',
  },
  'it': {
    // Header
    'app.tagline': 'Mira ad essere la migliore app meteo.',
    'header.signIn': 'Accedi',
    
    // Weather
    'weather.welcome': 'Benvenuto su Rainz',
    'weather.searchLocation': 'Cerca una località sopra o consenti l\'accesso alla posizione',
    'weather.failed': 'Impossibile caricare i dati meteo',
    'weather.tryAgain': 'Riprova',
    'weather.demoData': 'Dati Demo',
    'weather.demoMessage': 'Chiavi API necessarie per dati reali',
    'weather.refresh': 'Aggiorna',
    'weather.locationCard': 'Scheda Località',
    'weather.myLocation': 'La Mia Posizione',
    'weather.checkConnection': 'Controlla la tua connessione e riprova',
    
    // Weather metrics
    'weather.wind': 'Vento',
    'weather.visibility': 'Visibilità',
    'weather.feelsLike': 'Percepita',
    'weather.humidity': 'Umidità',
    'weather.pressure': 'Pressione',
    'weather.uvIndex': 'Indice UV',
    
    // Time
    'time.goodMorning': 'Buongiorno!',
    'time.dismiss': 'Ignora',
    'time.today': 'Oggi',
    'time.tomorrow': 'Domani',
    
    // Settings
    'settings.title': 'Impostazioni',
    'settings.account': 'Account',
    'settings.appearance': 'Aspetto',
    'settings.notifications': 'Notifiche',
    'settings.language': 'Lingua',
    'settings.signOut': 'Disconnetti',
    'settings.enableNotifications': 'Attiva Notifiche',
    'settings.testNotification': 'Invia Notifica di Test',
    'settings.cardVisibility': 'Visibilità Schede',
    'settings.cardOrder': 'Ordine Schede',
    'settings.save': 'Salva',
    'settings.customise': 'Personalizza la tua esperienza meteo',
    'settings.temperatureUnits': 'Unità di Temperatura',
    'settings.useCelsius': 'Usa Celsius (°C)',
    'settings.currentlyFahrenheit': 'Attualmente usa Fahrenheit (°F)',
    'settings.currentlyCelsius': 'Attualmente usa Celsius (°C)',
    'settings.reset': 'Ripristina',
    'settings.reloadChanges': 'Ricarica per attivare le modifiche.',
    'settings.languageChanged': 'Lingua cambiata',
    'settings.changedTo': 'Cambiato in',
    
    // Pollen
    'pollen.title': 'Previsioni Polline',
    'pollen.track': 'Traccia Allergie',
    'pollen.low': 'Basso',
    'pollen.moderate': 'Moderato',
    'pollen.high': 'Alto',
    'pollen.veryHigh': 'Molto Alto',
    'pollen.pollenIndex': 'Indice Pollinico',
    'pollen.hourlyForecast': 'Previsioni 24 Ore',
    'pollen.tenDayForecast': 'Previsioni 10 Giorni',
    'pollen.detailedMetrics': 'Metriche Dettagliate',
    'pollen.userRoutines': 'Routine Utente',
    
    // Footer
    'footer.dataFrom': 'Dati da',
    'footer.disclaimer': 'Non siamo responsabili di inesattezze o affermazioni errate.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.da': 'Dansk',
    'language.sv': 'Svenska',
    'language.no': 'Norsk',
    'language.fr': 'Français',
    'language.it': 'Italiano',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rainz-language');
    return (saved as Language) || 'en-GB';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rainz-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export const languageFlags: Record<Language, string> = {
  'en-GB': '🇬🇧',
  'da': '🇩🇰',
  'sv': '🇸🇪',
  'no': '🇳🇴',
  'fr': '🇫🇷',
  'it': '🇮🇹',
};

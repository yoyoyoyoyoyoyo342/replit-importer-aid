import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Language = 'en-GB' | 'en-US' | 'da' | 'sv' | 'no' | 'fr' | 'it';

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
    'search.placeholder': 'Search for a location...',
    'search.searching': 'Searching...',
    'search.noResults': 'No locations found',
    
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
    
    // Morning Review
    'morning.title': 'AI Morning Review',
    'morning.generating': 'Generating your morning briefing...',
    'morning.generate': 'Generate AI Morning Briefing',
    'morning.outfit': 'What to Wear:',
    'morning.pollenAlerts': 'Pollen Alerts',
    'morning.activities': 'Activities:',
    'morning.keyInsight': 'Key Insight:',
    
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
    'pollen.liveData': 'Live seasonal allergy data',
    'pollen.noData': 'No pollen data available',
    'pollen.locationRequired': 'Location data required',
    'pollen.trackAllergy': 'Track Allergy',
    'pollen.addAllergy': 'Add Allergy to Track',
    'pollen.allergen': 'Allergen',
    'pollen.allergenPlaceholder': 'e.g. Grass, Birch, Ragweed',
    'pollen.sensitivityLevel': 'Sensitivity Level',
    'pollen.mild': 'Mild',
    'pollen.severe': 'Severe',
    'pollen.addAllergyButton': 'Add Allergy',
    'pollen.currentSeason': 'Current Season Pollen',
    'pollen.active': 'active',
    'pollen.yourTracked': 'Your Tracked Allergies',
    'pollen.scale': 'Pollen Scale:',
    'pollen.scaleInfo': '0 = No risk • 1-2 = Low • 3-5 = Medium • 6-8 = High • 9+ = Very High',
    'pollen.alertInfo': 'Red alerts for your tracked allergies when levels may affect you',
    'pollen.adviceInfo': 'Higher numbers indicate increased pollen concentration. Consider limiting outdoor activities during high pollen periods.',
    'pollen.noRisk': 'No risk',
    'pollen.medium': 'Medium',
    'pollen.earlySpring': 'Early Spring',
    'pollen.spring': 'Spring',
    'pollen.lateSpring': 'Late Spring/Summer',
    'pollen.lateSummer': 'Late Summer',
    'pollen.springSummer': 'Spring/Summer',
    'pollen.autumn': 'Autumn',
    'pollen.alreadyTracked': 'You already have this allergy tracked',
    'pollen.addFailed': 'Failed to add allergy',
    'pollen.addSuccess': 'Allergy added successfully',
    'pollen.removeFailed': 'Failed to remove allergy',
    'pollen.removeSuccess': 'Allergy removed',
    
    // Footer
    'footer.dataFrom': 'Data from',
    'footer.disclaimer': 'We are not to be held accountable for any inaccuracies or wrong claims.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.en-US': 'American English',
    'language.da': 'Dansk',
    'language.sv': 'Svenska',
    'language.no': 'Norsk',
    'language.fr': 'Français',
    'language.it': 'Italiano',
  },
  'en-US': {
    // Header
    'app.tagline': 'Aiming to be the best weather app.',
    'header.signIn': 'Sign In',
    'search.placeholder': 'Search for a location...',
    'search.searching': 'Searching...',
    'search.noResults': 'No locations found',
    
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
    
    // Morning Review
    'morning.title': 'AI Morning Review',
    'morning.generating': 'Generating your morning briefing...',
    'morning.generate': 'Generate AI Morning Briefing',
    'morning.outfit': 'What to Wear:',
    'morning.pollenAlerts': 'Pollen Alerts',
    'morning.activities': 'Activities:',
    'morning.keyInsight': 'Key Insight:',
    
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
    'settings.customise': 'Customize your weather app experience',
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
    'pollen.liveData': 'Live seasonal allergy data',
    'pollen.noData': 'No pollen data available',
    'pollen.locationRequired': 'Location data required',
    'pollen.trackAllergy': 'Track Allergy',
    'pollen.addAllergy': 'Add Allergy to Track',
    'pollen.allergen': 'Allergen',
    'pollen.allergenPlaceholder': 'e.g. Grass, Birch, Ragweed',
    'pollen.sensitivityLevel': 'Sensitivity Level',
    'pollen.mild': 'Mild',
    'pollen.severe': 'Severe',
    'pollen.addAllergyButton': 'Add Allergy',
    'pollen.currentSeason': 'Current Season Pollen',
    'pollen.active': 'active',
    'pollen.yourTracked': 'Your Tracked Allergies',
    'pollen.scale': 'Pollen Scale:',
    'pollen.scaleInfo': '0 = No risk • 1-2 = Low • 3-5 = Medium • 6-8 = High • 9+ = Very High',
    'pollen.alertInfo': 'Red alerts for your tracked allergies when levels may affect you',
    'pollen.adviceInfo': 'Higher numbers indicate increased pollen concentration. Consider limiting outdoor activities during high pollen periods.',
    'pollen.noRisk': 'No risk',
    'pollen.medium': 'Medium',
    'pollen.earlySpring': 'Early Spring',
    'pollen.spring': 'Spring',
    'pollen.lateSpring': 'Late Spring/Summer',
    'pollen.lateSummer': 'Late Summer',
    'pollen.springSummer': 'Spring/Summer',
    'pollen.autumn': 'Fall',
    'pollen.alreadyTracked': 'You already have this allergy tracked',
    'pollen.addFailed': 'Failed to add allergy',
    'pollen.addSuccess': 'Allergy added successfully',
    'pollen.removeFailed': 'Failed to remove allergy',
    'pollen.removeSuccess': 'Allergy removed',
    
    // Footer
    'footer.dataFrom': 'Data from',
    'footer.disclaimer': 'We are not to be held accountable for any inaccuracies or wrong claims.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.en-US': 'American English',
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
    'search.placeholder': 'Søg efter en placering...',
    'search.searching': 'Søger...',
    'search.noResults': 'Ingen placeringer fundet',
    
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
    
    // Morning Review
    'morning.title': 'AI Morgen Gennemgang',
    'morning.generating': 'Genererer din morgen briefing...',
    'morning.generate': 'Generer AI Morgen Briefing',
    'morning.outfit': 'Hvad skal man have på:',
    'morning.pollenAlerts': 'Pollen Advarsler',
    'morning.activities': 'Aktiviteter:',
    'morning.keyInsight': 'Vigtig Indsigt:',
    
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
    'pollen.liveData': 'Live sæsonbestemte allergidata',
    'pollen.noData': 'Ingen pollendata tilgængelige',
    'pollen.locationRequired': 'Placeringsdata påkrævet',
    'pollen.trackAllergy': 'Spor Allergi',
    'pollen.addAllergy': 'Tilføj Allergi at Spore',
    'pollen.allergen': 'Allergen',
    'pollen.allergenPlaceholder': 'f.eks. Græs, Birk, Ambrosie',
    'pollen.sensitivityLevel': 'Følsomhedsniveau',
    'pollen.mild': 'Mild',
    'pollen.severe': 'Alvorlig',
    'pollen.addAllergyButton': 'Tilføj Allergi',
    'pollen.currentSeason': 'Nuværende Sæson Pollen',
    'pollen.active': 'aktiv',
    'pollen.yourTracked': 'Dine Sporede Allergier',
    'pollen.scale': 'Pollenskala:',
    'pollen.scaleInfo': '0 = Ingen risiko • 1-2 = Lav • 3-5 = Medium • 6-8 = Høj • 9+ = Meget Høj',
    'pollen.alertInfo': 'Røde advarsler for dine sporede allergier, når niveauerne kan påvirke dig',
    'pollen.adviceInfo': 'Højere tal indikerer øget pollenkoncentration. Overvej at begrænse udendørs aktiviteter i perioder med højt pollental.',
    'pollen.noRisk': 'Ingen risiko',
    'pollen.medium': 'Medium',
    'pollen.earlySpring': 'Tidligt Forår',
    'pollen.spring': 'Forår',
    'pollen.lateSpring': 'Sent Forår/Sommer',
    'pollen.lateSummer': 'Sen Sommer',
    'pollen.springSummer': 'Forår/Sommer',
    'pollen.autumn': 'Efterår',
    'pollen.alreadyTracked': 'Du har allerede denne allergi sporet',
    'pollen.addFailed': 'Kunne ikke tilføje allergi',
    'pollen.addSuccess': 'Allergi tilføjet med succes',
    'pollen.removeFailed': 'Kunne ikke fjerne allergi',
    'pollen.removeSuccess': 'Allergi fjernet',
    
    // Footer
    'footer.dataFrom': 'Data fra',
    'footer.disclaimer': 'Vi er ikke ansvarlige for unøjagtigheder eller forkerte påstande.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.en-US': 'American English',
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
    'search.placeholder': 'Sök efter en plats...',
    'search.searching': 'Söker...',
    'search.noResults': 'Inga platser hittades',
    
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
    
    // Morning Review
    'morning.title': 'AI Morgon Översikt',
    'morning.generating': 'Genererar din morgonbriefing...',
    'morning.generate': 'Generera AI Morgonbriefing',
    'morning.outfit': 'Vad ska man ha på sig:',
    'morning.pollenAlerts': 'Pollenvarningar',
    'morning.activities': 'Aktiviteter:',
    'morning.keyInsight': 'Viktig Insikt:',
    
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
    'pollen.liveData': 'Live säsongsallergidata',
    'pollen.noData': 'Ingen pollendata tillgänglig',
    'pollen.locationRequired': 'Platsdata krävs',
    'pollen.trackAllergy': 'Spåra Allergi',
    'pollen.addAllergy': 'Lägg till Allergi att Spåra',
    'pollen.allergen': 'Allergen',
    'pollen.allergenPlaceholder': 't.ex. Gräs, Björk, Ragweed',
    'pollen.sensitivityLevel': 'Känslighetsnivå',
    'pollen.mild': 'Mild',
    'pollen.severe': 'Allvarlig',
    'pollen.addAllergyButton': 'Lägg till Allergi',
    'pollen.currentSeason': 'Nuvarande Säsongs Pollen',
    'pollen.active': 'aktiv',
    'pollen.yourTracked': 'Dina Spårade Allergier',
    'pollen.scale': 'Pollenskala:',
    'pollen.scaleInfo': '0 = Ingen risk • 1-2 = Låg • 3-5 = Medium • 6-8 = Hög • 9+ = Mycket Hög',
    'pollen.alertInfo': 'Röda larm för dina spårade allergier när nivåerna kan påverka dig',
    'pollen.adviceInfo': 'Högre siffror indikerar ökad pollenkoncentration. Överväg att begränsa utomhusaktiviteter under perioder med högt pollen.',
    'pollen.noRisk': 'Ingen risk',
    'pollen.medium': 'Medium',
    'pollen.earlySpring': 'Tidig Vår',
    'pollen.spring': 'Vår',
    'pollen.lateSpring': 'Sen Vår/Sommar',
    'pollen.lateSummer': 'Sen Sommar',
    'pollen.springSummer': 'Vår/Sommar',
    'pollen.autumn': 'Höst',
    'pollen.alreadyTracked': 'Du har redan denna allergi spårad',
    'pollen.addFailed': 'Kunde inte lägga till allergi',
    'pollen.addSuccess': 'Allergi tillagd framgångsrikt',
    'pollen.removeFailed': 'Kunde inte ta bort allergi',
    'pollen.removeSuccess': 'Allergi borttagen',
    
    // Footer
    'footer.dataFrom': 'Data från',
    'footer.disclaimer': 'Vi ansvarar inte för felaktigheter eller felaktiga påståenden.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.en-US': 'American English',
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
    'search.placeholder': 'Søk etter en plassering...',
    'search.searching': 'Søker...',
    'search.noResults': 'Ingen plasseringer funnet',
    
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
    
    // Morning Review
    'morning.title': 'AI Morgen Oversikt',
    'morning.generating': 'Genererer din morgenbriefing...',
    'morning.generate': 'Generer AI Morgenbriefing',
    'morning.outfit': 'Hva skal man ha på seg:',
    'morning.pollenAlerts': 'Pollenvarsler',
    'morning.activities': 'Aktiviteter:',
    'morning.keyInsight': 'Viktig Innsikt:',
    
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
    'pollen.liveData': 'Live sesongallergidata',
    'pollen.noData': 'Ingen pollendata tilgjengelig',
    'pollen.locationRequired': 'Plasseringsdata kreves',
    'pollen.trackAllergy': 'Spor Allergi',
    'pollen.addAllergy': 'Legg til Allergi å Spore',
    'pollen.allergen': 'Allergen',
    'pollen.allergenPlaceholder': 'f.eks. Gress, Bjørk, Ragweed',
    'pollen.sensitivityLevel': 'Følsomhetsnivå',
    'pollen.mild': 'Mild',
    'pollen.severe': 'Alvorlig',
    'pollen.addAllergyButton': 'Legg til Allergi',
    'pollen.currentSeason': 'Nåværende Sesong Pollen',
    'pollen.active': 'aktiv',
    'pollen.yourTracked': 'Dine Sporede Allergier',
    'pollen.scale': 'Pollenskala:',
    'pollen.scaleInfo': '0 = Ingen risiko • 1-2 = Lav • 3-5 = Medium • 6-8 = Høy • 9+ = Veldig Høy',
    'pollen.alertInfo': 'Røde varsler for dine sporede allergier når nivåene kan påvirke deg',
    'pollen.adviceInfo': 'Høyere tall indikerer økt pollenkonsentrasjon. Vurder å begrense utendørs aktiviteter i perioder med høyt pollen.',
    'pollen.noRisk': 'Ingen risiko',
    'pollen.medium': 'Medium',
    'pollen.earlySpring': 'Tidlig Vår',
    'pollen.spring': 'Vår',
    'pollen.lateSpring': 'Sen Vår/Sommer',
    'pollen.lateSummer': 'Sen Sommer',
    'pollen.springSummer': 'Vår/Sommer',
    'pollen.autumn': 'Høst',
    'pollen.alreadyTracked': 'Du har allerede denne allergien sporet',
    'pollen.addFailed': 'Kunne ikke legge til allergi',
    'pollen.addSuccess': 'Allergi lagt til vellykket',
    'pollen.removeFailed': 'Kunne ikke fjerne allergi',
    'pollen.removeSuccess': 'Allergi fjernet',
    
    // Footer
    'footer.dataFrom': 'Data fra',
    'footer.disclaimer': 'Vi er ikke ansvarlige for unøyaktigheter eller feil påstander.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.en-US': 'American English',
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
    'search.placeholder': 'Rechercher un lieu...',
    'search.searching': 'Recherche en cours...',
    'search.noResults': 'Aucun lieu trouvé',
    
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
    
    // Morning Review
    'morning.title': 'Revue Matinale IA',
    'morning.generating': 'Génération de votre briefing matinal...',
    'morning.generate': 'Générer Briefing Matinal IA',
    'morning.outfit': 'Quoi Porter:',
    'morning.pollenAlerts': 'Alertes Pollen',
    'morning.activities': 'Activités:',
    'morning.keyInsight': 'Conseil Clé:',
    
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
    'pollen.liveData': 'Données d\'allergies saisonnières en direct',
    'pollen.noData': 'Aucune donnée pollinique disponible',
    'pollen.locationRequired': 'Données de localisation requises',
    'pollen.trackAllergy': 'Suivre Allergie',
    'pollen.addAllergy': 'Ajouter Allergie à Suivre',
    'pollen.allergen': 'Allergène',
    'pollen.allergenPlaceholder': 'p.ex. Herbe, Bouleau, Ambroisie',
    'pollen.sensitivityLevel': 'Niveau de Sensibilité',
    'pollen.mild': 'Léger',
    'pollen.severe': 'Grave',
    'pollen.addAllergyButton': 'Ajouter Allergie',
    'pollen.currentSeason': 'Pollen de Saison Actuelle',
    'pollen.active': 'actif',
    'pollen.yourTracked': 'Vos Allergies Suivies',
    'pollen.scale': 'Échelle Pollinique :',
    'pollen.scaleInfo': '0 = Aucun risque • 1-2 = Faible • 3-5 = Moyen • 6-8 = Élevé • 9+ = Très Élevé',
    'pollen.alertInfo': 'Alertes rouges pour vos allergies suivies lorsque les niveaux peuvent vous affecter',
    'pollen.adviceInfo': 'Des nombres plus élevés indiquent une concentration de pollen accrue. Envisagez de limiter les activités extérieures pendant les périodes de pollen élevé.',
    'pollen.noRisk': 'Aucun risque',
    'pollen.medium': 'Moyen',
    'pollen.earlySpring': 'Début du Printemps',
    'pollen.spring': 'Printemps',
    'pollen.lateSpring': 'Fin du Printemps/Été',
    'pollen.lateSummer': 'Fin de l\'Été',
    'pollen.springSummer': 'Printemps/Été',
    'pollen.autumn': 'Automne',
    'pollen.alreadyTracked': 'Vous suivez déjà cette allergie',
    'pollen.addFailed': 'Échec de l\'ajout de l\'allergie',
    'pollen.addSuccess': 'Allergie ajoutée avec succès',
    'pollen.removeFailed': 'Échec de la suppression de l\'allergie',
    'pollen.removeSuccess': 'Allergie supprimée',
    
    // Footer
    'footer.dataFrom': 'Données de',
    'footer.disclaimer': 'Nous ne sommes pas responsables des inexactitudes ou des fausses déclarations.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.en-US': 'American English',
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
    'search.placeholder': 'Cerca una località...',
    'search.searching': 'Ricerca in corso...',
    'search.noResults': 'Nessuna località trovata',
    
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
    
    // Morning Review
    'morning.title': 'Revisione Mattutina IA',
    'morning.generating': 'Generazione del tuo briefing mattutino...',
    'morning.generate': 'Genera Briefing Mattutino IA',
    'morning.outfit': 'Cosa Indossare:',
    'morning.pollenAlerts': 'Avvisi Polline',
    'morning.activities': 'Attività:',
    'morning.keyInsight': 'Consiglio Chiave:',
    
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
    'pollen.liveData': 'Dati allergia stagionale in diretta',
    'pollen.noData': 'Nessun dato pollinico disponibile',
    'pollen.locationRequired': 'Dati di posizione richiesti',
    'pollen.trackAllergy': 'Traccia Allergia',
    'pollen.addAllergy': 'Aggiungi Allergia da Tracciare',
    'pollen.allergen': 'Allergene',
    'pollen.allergenPlaceholder': 'es. Erba, Betulla, Ambrosia',
    'pollen.sensitivityLevel': 'Livello di Sensibilità',
    'pollen.mild': 'Lieve',
    'pollen.severe': 'Grave',
    'pollen.addAllergyButton': 'Aggiungi Allergia',
    'pollen.currentSeason': 'Polline Stagione Corrente',
    'pollen.active': 'attivo',
    'pollen.yourTracked': 'Le Tue Allergie Tracciate',
    'pollen.scale': 'Scala Pollinica:',
    'pollen.scaleInfo': '0 = Nessun rischio • 1-2 = Basso • 3-5 = Medio • 6-8 = Alto • 9+ = Molto Alto',
    'pollen.alertInfo': 'Avvisi rossi per le tue allergie tracciate quando i livelli possono influenzarti',
    'pollen.adviceInfo': 'Numeri più alti indicano una maggiore concentrazione di polline. Considera di limitare le attività all\'aperto durante i periodi di alto polline.',
    'pollen.noRisk': 'Nessun rischio',
    'pollen.medium': 'Medio',
    'pollen.earlySpring': 'Inizio Primavera',
    'pollen.spring': 'Primavera',
    'pollen.lateSpring': 'Fine Primavera/Estate',
    'pollen.lateSummer': 'Fine Estate',
    'pollen.springSummer': 'Primavera/Estate',
    'pollen.autumn': 'Autunno',
    'pollen.alreadyTracked': 'Hai già questa allergia tracciata',
    'pollen.addFailed': 'Impossibile aggiungere allergia',
    'pollen.addSuccess': 'Allergia aggiunta con successo',
    'pollen.removeFailed': 'Impossibile rimuovere allergia',
    'pollen.removeSuccess': 'Allergia rimossa',
    
    // Footer
    'footer.dataFrom': 'Dati da',
    'footer.disclaimer': 'Non siamo responsabili di inesattezze o affermazioni errate.',
    
    // Languages
    'language.en-GB': 'British English',
    'language.en-US': 'American English',
    'language.da': 'Dansk',
    'language.sv': 'Svenska',
    'language.no': 'Norsk',
    'language.fr': 'Français',
    'language.it': 'Italiano',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en-GB');
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load language preference from database on mount
  useEffect(() => {
    const loadLanguagePreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from('user_preferences')
          .select('language')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data?.language) {
          setLanguageState(data.language as Language);
        } else {
          // Fallback to localStorage if no DB preference
          const saved = localStorage.getItem('rainz-language');
          if (saved) setLanguageState(saved as Language);
        }
      } else {
        // No user, use localStorage
        const saved = localStorage.getItem('rainz-language');
        if (saved) setLanguageState(saved as Language);
      }
    };

    loadLanguagePreference();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadLanguagePreference();
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('rainz-language', newLanguage);
    
    // Save to database if user is logged in
    if (userId) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            language: newLanguage,
            visible_cards: { hourly: true, pollen: true, tenDay: true, routines: true, detailedMetrics: true },
            card_order: ["pollen", "hourly", "tenDay", "detailedMetrics", "routines"]
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving language preference:', error);
        toast({
          title: "Could not save language preference",
          description: "Your selection will be reset when you log out.",
          variant: "destructive"
        });
      }
    }
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
  'en-US': '🇺🇸',
  'da': '🇩🇰',
  'sv': '🇸🇪',
  'no': '🇳🇴',
  'fr': '🇫🇷',
  'it': '🇮🇹',
};

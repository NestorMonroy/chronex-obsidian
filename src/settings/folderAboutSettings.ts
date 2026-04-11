/**
 * FolderAboutSettings - Configuración para _about_ notes
 */

export interface FolderAboutSettings {
  autoGenerateFolderAbout: boolean;  
  hideAboutFiles: boolean;             
  useCardView: boolean;                
  cardViewType: 'cute' | 'strip';      
  autoUpdateAboutContent: boolean;     
  includeDataviewLists: boolean;       
}

export const DEFAULT_FOLDER_ABOUT_SETTINGS: FolderAboutSettings = {
  autoGenerateFolderAbout: true,
  hideAboutFiles: false,
  useCardView: true,
  cardViewType: 'cute',
  autoUpdateAboutContent: true,
  includeDataviewLists: true
};

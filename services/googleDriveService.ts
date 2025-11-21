
// Service simulé pour l'interaction avec Google Drive
// En production, cela nécessiterait l'API GAPI + Authentification OAuth2

export interface DriveFolder {
  id: string;
  name: string;
}

export const authenticateGoogle = async (): Promise<boolean> => {
  // Simulation d'une authentification réussie après 1s
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Google Auth Simulated Success");
      resolve(true);
    }, 1000);
  });
};

export const listDriveFolders = async (): Promise<DriveFolder[]> => {
  // Mock de dossiers
  return [
    { id: 'folder_1', name: 'Dossiers Patients' },
    { id: 'folder_2', name: 'Facturation 2023' },
    { id: 'folder_3', name: 'Comptes Rendus' },
    { id: 'folder_4', name: 'Archives' }
  ];
};

export const uploadToDrive = async (
  fileBlob: Blob, 
  fileName: string, 
  folderId: string
): Promise<string> => {
  // Simulation d'upload
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Uploading ${fileName} to folder ${folderId} size: ${fileBlob.size}`);
      resolve(`https://drive.google.com/file/d/simulated_id_${Date.now()}`);
    }, 2000);
  });
};

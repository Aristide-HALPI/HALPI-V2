import React from 'react';
import { 
  Scissors, 
  ExternalLink, 
  FolderOpen,
  FileText,
  Archive,
  AlertCircle
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

export type ContentType = 'course' | 'exercise' | 'exam';

interface PdfSplitterMinimalProps {
  onOpenFileSelector: () => void;
  onOpenFolderSelector: () => void;
  onOpenZipSelector: () => void;
  contentType: ContentType; // Changé de onContentTypeChange à contentType directement
}

const PdfSplitterMinimal: React.FC<PdfSplitterMinimalProps> = ({ 
  onOpenFileSelector,
  onOpenFolderSelector,
  onOpenZipSelector,
  contentType
}) => {
  // Ouvrir SmallPDF
  const openSmallPdf = () => {
    window.open('https://smallpdf.com/fr/diviser-pdf#r=organize-split', '_blank');
  };

  // Obtenir le texte d'aide en fonction du type de contenu
  const getContentTypeHelpText = () => {
    switch(contentType) {
      case 'course':
        return "Pour que notre méthode d'accompagnement soit efficace, HALPI a besoin que ton cours soit découpé en chapitres distincts. Ce découpage est essentiel pour personnaliser ton apprentissage.";
      case 'exercise':
        return "Ajoute des exercices pratiques pour tester tes connaissances et renforcer ton apprentissage. Un bon découpage permet à HALPI de mieux t'accompagner.";
      case 'exam':
        return "Importe des examens des années précédentes pour mieux te préparer. Le découpage par examen permet à HALPI d'optimiser ta préparation.";
      default:
        return "";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* En-tête */}
        <h3 className="text-xl font-semibold text-gray-800">Importez votre contenu pédagogique</h3>

        {/* Section SmallPDF */}
        <div className="bg-blue-50 p-5 rounded-md border border-blue-200">
          <h4 className="font-medium text-blue-700 mb-3 flex items-center">
            <Scissors size={18} className="mr-2" />
            Découpage du PDF avec SmallPDF
          </h4>
          <p className="text-sm text-gray-700 mb-4">
            {getContentTypeHelpText()}
            Utilisez le lien ci-dessous pour accéder à SmallPDF, un outil en ligne gratuit qui vous permettra de transformer vos documents en PDF découpés. Après le découpage, vous pourrez uploader chaque chapitre individuellement ici.
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2 mb-4 ml-2">
            <li>Rendez-vous sur SmallPDF</li>
            <li>Téléchargez votre fichier PDF</li>
            <li>Découpez-le en {contentType === 'course' ? 'chapitres' : contentType === 'exercise' ? 'exercices' : 'examens'} distincts</li>
            <li>Téléchargez les fichiers découpés (format ZIP ou dossier)</li>
            <li>Importez les {contentType === 'course' ? 'chapitres' : contentType === 'exercise' ? 'exercices' : 'examens'} ci-dessous</li>
          </ol>
          
          {contentType === 'course' && (
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
              <h5 className="font-medium text-amber-700 mb-2 flex items-center">
                <AlertCircle size={16} className="mr-2" />
                Structure recommandée pour vos chapitres
              </h5>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li><strong>IMPORTANT :</strong> Séparez l'introduction et la conclusion en chapitres distincts</li>
                <li><strong>Chapitre 0 :</strong> Introduction, table des matières, préface (fichier séparé)</li>
                <li><strong>Chapitres 1 à X :</strong> Contenu principal du cours, divisé par chapitre ou par thèmes</li>
                <li><strong>Dernier chapitre :</strong> Conclusion, bibliographie, annexes (fichier séparé)</li>
              </ul>
              <p className="mt-2 text-xs text-amber-700 font-medium">La séparation des introductions et conclusions en chapitres distincts est essentielle pour que HALPI puisse analyser correctement votre cours.</p>

            </div>
          )}

          {contentType === 'exercise' && (
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
              <h5 className="font-medium text-amber-700 mb-2 flex items-center">
                <AlertCircle size={16} className="mr-2" />
                Organisation recommandée pour vos exercices
              </h5>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li><strong>Par niveau :</strong> Débutant, intermédiaire, avancé</li>
                <li><strong>Par thème :</strong> Organisez les exercices selon les chapitres du cours</li>
                <li><strong>Avec solutions :</strong> Incluez si possible les corrigés pour l'auto-évaluation</li>
              </ul>
            </div>
          )}

          {contentType === 'exam' && (
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
              <h5 className="font-medium text-amber-700 mb-2 flex items-center">
                <AlertCircle size={16} className="mr-2" />
                Conseils pour les examens des années précédentes
              </h5>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li><strong>Nommage clair :</strong> Incluez l'année et la session (ex: Examen_2023_Janvier)</li>
                <li><strong>Avec corrigés :</strong> Si disponibles, ajoutez les corrigés dans des fichiers séparés</li>
                <li><strong>Variété :</strong> Incluez différents types d'examens (partiels, finaux, rattrapages)</li>
              </ul>
            </div>
          )}
          
          <Button 
            variant="primary" 
            onClick={openSmallPdf}
            className="flex items-center"
          >
            <ExternalLink size={16} className="mr-1.5" />
            Ouvrir SmallPDF
          </Button>
        </div>

        {/* Téléchargement des chapitres */}
        <div className="bg-gray-50 p-5 rounded-md border border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">
            Importer les {contentType === 'course' ? 'chapitres' : contentType === 'exercise' ? 'exercices' : 'examens'} découpés
          </h4>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenFileSelector}
              className="flex items-center"
            >
              <FileText size={16} className="mr-1.5" />
              Ajouter des fichiers
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenFolderSelector}
              className="flex items-center"
            >
              <FolderOpen size={16} className="mr-1.5" />
              Importer un dossier
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenZipSelector}
              className="flex items-center"
            >
              <Archive size={16} className="mr-1.5" />
              Importer un ZIP
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PdfSplitterMinimal;

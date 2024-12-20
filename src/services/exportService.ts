import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Concept } from '../types/concepts';

export class ExportService {
  /**
   * Récupère le courseId à partir du pathId
   */
  private async getCourseIdFromPath(pathId: string): Promise<string> {
    const pathDoc = await getDoc(doc(db, 'learningPaths', pathId));
    if (!pathDoc.exists()) {
      throw new Error('Learning path not found');
    }
    const pathData = pathDoc.data();
    return pathData.courseId;
  }

  /**
   * Récupère tous les concepts clés pour un parcours donné
   */
  private async getConceptsForPath(pathId: string): Promise<Concept[]> {
    const courseId = await this.getCourseIdFromPath(pathId);
    const conceptsRef = collection(db, 'courses', courseId, 'concepts');
    const conceptsSnap = await getDocs(conceptsRef);
    return conceptsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Concept));
  }

  /**
   * Exporte les concepts au format CSV
   */
  private async exportToCSV(concepts: Concept[]): Promise<void> {
    if (concepts.length === 0) return;

    // Préparer les en-têtes
    const headers = ['Nom', 'Quoi', 'Comment', 'Pourquoi', 'Points clés'];
    const customFields = new Set<string>();

    // Collecter tous les champs personnalisés uniques
    concepts.forEach(concept => {
      if (concept.customFields) {
        concept.customFields.forEach(field => {
          customFields.add(field.label);
        });
      }
    });

    // Ajouter les champs personnalisés aux en-têtes
    headers.push(...Array.from(customFields));

    // Créer les lignes de données
    const rows = concepts.map(concept => {
      const row = [
        concept.name || '',
        concept.what || '',
        concept.how || '',
        concept.why || '',
        concept.keyPoints || ''
      ];

      // Ajouter les valeurs des champs personnalisés
      customFields.forEach(fieldLabel => {
        const customField = concept.customFields?.find(f => f.label === fieldLabel);
        row.push(customField?.value || '');
      });

      return row;
    });

    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'concepts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Point d'entrée principal pour l'export des concepts
   */
  public async exportConcepts(pathId: string): Promise<void> {
    try {
      const concepts = await this.getConceptsForPath(pathId);
      await this.exportToCSV(concepts);
    } catch (error) {
      console.error('Error exporting concepts:', error);
      throw error;
    }
  }
}

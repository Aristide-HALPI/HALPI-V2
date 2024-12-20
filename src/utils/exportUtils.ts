import { Concept } from '../types/concepts';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CourseInfo {
  courseName: string;
  chapterNumber: string;
  chapterTitle: string;
}

async function getCourseInfo(chapterId: string): Promise<CourseInfo> {
  try {
    console.log('Getting info for chapter:', chapterId);
    const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
    if (!chapterDoc.exists()) {
      console.error('Chapter not found:', chapterId);
      throw new Error('Chapter not found');
    }
    
    const chapterData = chapterDoc.data();
    console.log('Raw chapter data:', chapterData);
    
    // Extraire le numéro du chapitre depuis le titre
    const chapterNumberMatch = chapterData.title?.match(/Chapitre (\d+)/i);
    const chapterNumber = chapterNumberMatch ? chapterNumberMatch[1] : '';
    console.log('Extracted chapter number:', chapterNumber);

    const courseDoc = await getDoc(doc(db, 'courses', chapterData.courseId));
    if (!courseDoc.exists()) {
      console.error('Course not found:', chapterData.courseId);
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    console.log('Course data:', courseData);

    return {
      courseName: courseData.title,
      chapterNumber: chapterNumber,
      chapterTitle: chapterData.title || ''
    };
  } catch (error) {
    console.error('Error getting course info:', error);
    return {
      courseName: 'Unknown Course',
      chapterNumber: 'Unknown',
      chapterTitle: 'Unknown Chapter'
    };
  }
}

export async function exportConceptsToCSV(concepts: Concept[]): Promise<void> {
  if (concepts.length === 0) return;

  try {
    // Obtenir tous les champs personnalisés uniques
    const customFieldLabels = new Set<string>();
    concepts.forEach(concept => {
      if (concept.customFields && concept.customFields.length > 0) {
        concept.customFields.forEach(field => {
          customFieldLabels.add(field.label);
        });
      }
    });

    // Créer l'en-tête du CSV avec les champs de base et personnalisés
    const baseHeaders = ['Chapitre', 'Nom', 'Qui', 'Quoi', 'Comment', 'Pourquoi', 'Quand', 'Où', 'Points clés'];
    const allHeaders = [...baseHeaders, ...Array.from(customFieldLabels)];
    
    // Récupérer les infos de tous les chapitres
    console.log('Concepts to process:', concepts);
    const chapterInfos = new Map<string, CourseInfo>();
    for (const concept of concepts) {
      console.log('Processing concept:', concept);
      if (!chapterInfos.has(concept.chapterId)) {
        console.log('Getting info for concept chapter:', concept.chapterId);
        const info = await getCourseInfo(concept.chapterId);
        console.log('Got chapter info:', info);
        chapterInfos.set(concept.chapterId, info);
      }
    }
    
    // Transformer les concepts en lignes CSV
    const rows = await Promise.all(concepts.map(async concept => {
      const chapterInfo = chapterInfos.get(concept.chapterId);
      console.log('Using chapter info for concept:', concept.name, chapterInfo);
      // Champs de base
      const baseFields = [
        `Chapitre ${chapterInfo?.chapterNumber || '?'}`, 
        concept.name,
        concept.who || '',
        concept.what || '',
        concept.how || '',
        concept.why || '',
        concept.when || '',
        concept.where || '',
        concept.keyPoints || ''
      ];

      // Ajouter les valeurs des champs personnalisés
      const customValues = Array.from(customFieldLabels).map(label => {
        const field = concept.customFields?.find(f => f.label === label);
        return field?.value || '';
      });

      return [...baseFields, ...customValues].map(cell => 
        `"${(cell || '').replace(/"/g, '""')}"`
      );
    }));

    // Ajouter les informations du cours en en-tête
    const firstChapterInfo = chapterInfos.get(concepts[0].chapterId);
    const courseInfoHeader = [
      `"${firstChapterInfo?.courseName || 'Unknown Course'}"`
    ].join(',');

    // Combiner tout le contenu
    const csvContent = [
      courseInfoHeader,
      '',  // Ligne vide pour séparer
      allHeaders.map(header => `"${header}"`).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Créer un Blob avec le contenu CSV
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    // Créer un lien temporaire pour télécharger le fichier
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `concepts_${firstChapterInfo?.courseName.replace(/[^a-z0-9]/gi, '_')}_ch${firstChapterInfo?.chapterNumber}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    
    // Déclencher le téléchargement
    link.click();
    
    // Nettoyer
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting concepts:', error);
    throw error;
  }
}

import { 
  QuizQuestion, 
  QuestionType
} from '../types/questions';
import { Concept } from '../types/concepts';
import { v4 as uuidv4 } from 'uuid';

type DifficultyLevel = 'level_1' | 'level_2' | 'level_3';
type AspectName = 'what' | 'how' | 'why' | 'who' | 'when' | 'where' | 'keyPoints';

export class MockAIService {
    private generateAspectQuestion(conceptId: string, aspectName: string, content: string | null): any {
        if (!content) return null;

        const levels = [1, 2, 3] as const;
        const level = levels[Math.floor(Math.random() * levels.length)];

        return {
            id: uuidv4(),
            type: 'key_question',
            level,
            question: `Comment ${aspectName} fonctionne-t-il en pratique ?`,
            targetAspect: aspectName,
            modelAnswer: `Voici une réponse modèle pour l'aspect ${aspectName}: ${content}`,
            feedback: `Feedback pour la question sur ${aspectName}`,
            expectedAnswer: `Réponse attendue pour ${aspectName}`,
            evaluationCriteria: [
                `Critère 1 pour ${aspectName}`,
                `Critère 2 pour ${aspectName}`,
                `Critère 3 pour ${aspectName}`
            ],
            conceptId
        };
    }

    async generateKeyQuestions(concept: Concept): Promise<any> {
        const questions: any[] = [];
        const aspectsCovered: string[] = [];

        // Générer des questions pour chaque aspect présent
        const aspects: [string, string | null][] = [
            ['what', concept.what || null],
            ['how', concept.how || null],
            ['why', concept.why || null],
            ['who', concept.who || null]
        ];

        for (const [aspectName, content] of aspects) {
            const question = this.generateAspectQuestion(concept.id, aspectName, content);
            if (question) {
                questions.push(question);
                aspectsCovered.push(aspectName);
            }
        }

        // Ajouter des métadonnées comme le ferait aiAgentService
        const metadata: any = {
            conceptId: concept.id,
            aspectsCovered,
            totalQuestions: questions.length
        };

        return {
            questions,
            metadata
        };
    }

    async evaluateConcept(userConcept: Concept): Promise<any> {
        const detailedScores: Record<string, number> = {};
        const aspects = ['what', 'how', 'why', 'who'];
        
        aspects.forEach(aspect => {
            if (userConcept[aspect as keyof Concept]) {
                detailedScores[aspect] = Math.floor(Math.random() * 11); // Score sur 10
            }
        });

        const score = Math.floor(
            Object.values(detailedScores).reduce((acc, score) => acc + score, 0) / 
            Object.values(detailedScores).length
        );

        // Déterminer le niveau de maîtrise
        let masteringLevel: 'total' | 'partial' | 'insufficient';
        if (score >= 8.5) { // 8.5/10
            masteringLevel = 'total';
        } else if (score >= 7) { // 7/10
            masteringLevel = 'partial';
        } else {
            masteringLevel = 'insufficient';
        }

        return {
            isCorrect: score >= 7, // 7/10
            score,
            masteringLevel,
            feedback: {
                correct: ['Points forts identifiés'],
                missing: ['Éléments à améliorer'],
                wrong: ['Erreurs à corriger']
            },
            detailedScores
        };
    }

    async generateQuizQuestions(concept: Concept): Promise<QuizQuestion[]> {
        console.log('MockAI: Starting quiz question generation for concept:', concept.name);
        
        const questions: QuizQuestion[] = [];
        
        // Définir les types de questions par niveau de difficulté
        const questionTypesByLevel: Record<DifficultyLevel, QuestionType[]> = {
            'level_1': [
                'true_false',
                'mcq_single',
                'fill_blank',
                'multiple_choice'
            ],
            'level_2': [
                'true_false_justify',
                'mcq_multiple',
                'matching',
                'ordering'
            ],
            'level_3': [
                'assertion_reason',
                'open_ended',
                'case_study'
            ]
        };

        // Liste des aspects disponibles dans le concept
        const availableAspects: Array<[AspectName, string]> = [
            ['who', concept.who],
            ['what', concept.what],
            ['why', concept.why],
            ['how', concept.how],
            ['when', concept.when],
            ['where', concept.where],
            ['keyPoints', concept.keyPoints]
        ].filter(([_, content]) => content) as Array<[AspectName, string]>;

        if (availableAspects.length === 0) {
            console.warn('MockAI: No content available for generating questions');
            return [];
        }

        // Générer un nombre égal de questions pour chaque niveau
        const levels: DifficultyLevel[] = ['level_1', 'level_2', 'level_3'];
        const questionsPerLevel = 4; // Nombre de questions par niveau

        for (const level of levels) {
            console.log(`MockAI: Generating questions for level ${level}`);
            const questionTypes = questionTypesByLevel[level];
            const points = level === 'level_1' ? 1 : level === 'level_2' ? 2 : 3;

            // Générer plusieurs questions pour ce niveau
            for (let i = 0; i < questionsPerLevel; i++) {
                // Sélectionner un type de question aléatoire pour ce niveau
                const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
                
                // Sélectionner un aspect aléatoire
                const [aspectName, content] = availableAspects[Math.floor(Math.random() * availableAspects.length)];

                console.log(`MockAI: Generating ${level} question of type:`, type);

                try {
                    const question = this.generateQuestionByType(
                        type,
                        aspectName,
                        content,
                        level,
                        concept.id,
                        points
                    );

                    // S'assurer que le niveau est correctement défini
                    question.difficultyLevel = level;
                    
                    questions.push(question);
                    console.log('MockAI: Generated question:', { 
                        type, 
                        aspectName, 
                        level,
                        difficultyLevel: question.difficultyLevel 
                    });
                } catch (error) {
                    console.error(`Error generating question for level ${level}:`, error);
                }
            }
        }

        // Mélanger les questions pour ne pas les avoir groupées par niveau
        const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

        // Log de la distribution des questions par niveau
        const distributionByLevel = shuffledQuestions.reduce((acc, q) => {
            const level = q.difficultyLevel || 'unknown';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('MockAI: Question distribution by level:', distributionByLevel);
        
        return shuffledQuestions;
    }

    private generateQuestionByType(
        type: QuestionType,
        aspectName: AspectName,
        content: string,
        difficultyLevel: DifficultyLevel,
        conceptId: string,
        points: number
    ): QuizQuestion {
        let question: QuizQuestion;
        
        try {
            switch (type) {
                case 'fill_blank':
                    question = this.generateFillBlank(conceptId, aspectName, content, difficultyLevel);
                    break;
                case 'matrix':
                    question = this.generateMatrixQuestion(conceptId, aspectName, content, difficultyLevel);
                    break;
                case 'matching':
                    const pairs = this.generateMatchingPairs(content, difficultyLevel === 'level_1' ? 3 : difficultyLevel === 'level_2' ? 4 : 5);
                    question = {
                        id: uuidv4(),
                        type: 'matching',
                        question: `Associez les éléments correspondants pour ${aspectName}:`,
                        conceptId,
                        points,
                        aspect: aspectName,
                        pairs,
                        correctAnswer: pairs.map(p => `${p.term}:${p.definition}`),
                        feedback: 'Réponse enregistrée',
                        explanation: `Cette question de niveau ${difficultyLevel} teste votre capacité à faire des associations dans ${aspectName}`,
                        difficultyLevel
                    };
                    break;
                case 'mcq_single':
                    question = this.generateMCQSingle(conceptId, aspectName, content, difficultyLevel);
                    break;
                case 'mcq_multiple':
                    question = this.generateMCQMultiple(conceptId, aspectName, content, difficultyLevel);
                    break;
                case 'true_false':
                    question = this.generateTrueFalse(conceptId, aspectName, content, difficultyLevel);
                    break;
                case 'true_false_justify':
                    question = this.generateTrueFalseJustify(conceptId, aspectName, content, difficultyLevel);
                    break;
                case 'assertion_reason':
                    question = this.generateAssertionReason(conceptId, aspectName, content, difficultyLevel);
                    break;
                case 'open_ended':
                    question = this.generateOpenEnded(conceptId, aspectName, content, difficultyLevel);
                    break;
                default:
                    question = {
                        id: uuidv4(),
                        type: type,
                        question: `Question de type ${type} sur ${aspectName}`,
                        conceptId,
                        points,
                        aspect: aspectName,
                        correctAnswer: 'default_answer',
                        feedback: 'Réponse enregistrée',
                        explanation: `Cette question de niveau ${difficultyLevel} teste vos connaissances sur ${aspectName}`,
                        difficultyLevel
                    };
            }
            
            // S'assurer que le niveau est défini
            question.difficultyLevel = difficultyLevel;
            return question;
            
        } catch (error) {
            console.error(`Error in generateQuestionByType for type ${type}:`, error);
            throw error;
        }
    }

    private generateMCQSingle(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        // Ajuster le nombre de points selon le niveau de difficulté
        const points = difficultyLevel === 'level_1' ? 1 : difficultyLevel === 'level_2' ? 2 : 3;
        
        // Extraire des phrases du contenu pour générer des options plus réalistes
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const options = sentences.length >= 4 
            ? sentences.slice(0, 4).map(s => s.trim())
            : [
                `Option niveau ${difficultyLevel} - 1`,
                `Option niveau ${difficultyLevel} - 2`,
                `Option niveau ${difficultyLevel} - 3`,
                `Option niveau ${difficultyLevel} - 4`
            ];
        
        const correctAnswerIndex = Math.floor(Math.random() * options.length);
        
        return {
            id: uuidv4(),
            type: 'mcq_single',
            question: `Question de niveau ${difficultyLevel} sur ${aspectName}: ${content.substring(0, 50)}...`,
            conceptId,
            points,
            aspect: aspectName,
            options,
            correctAnswer: options[correctAnswerIndex],
            feedback: 'Réponse enregistrée',
            explanation: `Cette question de niveau ${difficultyLevel} teste votre compréhension de ${aspectName}`
        };
    }

    private generateMCQMultiple(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        const points = difficultyLevel === 'level_1' ? 2 : difficultyLevel === 'level_2' ? 4 : 6;
        
        // Utiliser le contenu pour générer des options
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const options = sentences.length >= 4 
            ? sentences.slice(0, 4).map(s => s.trim())
            : [
                `Option multiple ${difficultyLevel} - 1`,
                `Option multiple ${difficultyLevel} - 2`,
                `Option multiple ${difficultyLevel} - 3`,
                `Option multiple ${difficultyLevel} - 4`
            ];
        
        // Sélectionner aléatoirement 2 réponses correctes
        const correctAnswers = [...options]
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
        
        return {
            id: uuidv4(),
            type: 'mcq_multiple',
            question: `Question à choix multiples de niveau ${difficultyLevel} sur ${aspectName}: ${content.substring(0, 50)}...`,
            conceptId,
            points,
            aspect: aspectName,
            options,
            correctAnswer: correctAnswers,
            feedback: 'Réponse enregistrée',
            explanation: `Cette question de niveau ${difficultyLevel} teste votre compréhension approfondie de ${aspectName}`
        };
    }

    private generateTrueFalse(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        const points = difficultyLevel === 'level_1' ? 1 : difficultyLevel === 'level_2' ? 2 : 3;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const statement = sentences.length > 0 
            ? sentences[0].trim()
            : `Affirmation de niveau ${difficultyLevel} sur ${aspectName}`;
        
        return {
            id: uuidv4(),
            type: 'true_false',
            question: `Vrai ou faux (niveau ${difficultyLevel}): ${statement}`,
            conceptId,
            points,
            aspect: aspectName,
            correctAnswer: Math.random() < 0.5 ? 'true' : 'false',
            feedback: 'Réponse enregistrée',
            explanation: `Cette question de niveau ${difficultyLevel} vérifie votre compréhension de base de ${aspectName}`
        };
    }

    private generateOpenEnded(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        const points = difficultyLevel === 'level_1' ? 3 : difficultyLevel === 'level_2' ? 5 : 8;
        
        return {
            id: uuidv4(),
            type: 'open_ended',
            question: `Question ouverte de niveau ${difficultyLevel} sur ${aspectName}: Expliquez ${content.substring(0, 100)}...`,
            conceptId,
            points,
            aspect: aspectName,
            correctAnswer: content,
            evaluationCriteria: [
                'Clarté de l\'explication',
                'Utilisation des concepts appropriés',
                'Profondeur de l\'analyse',
                difficultyLevel === 'level_3' ? 'Capacité de synthèse' : '',
                difficultyLevel === 'level_3' ? 'Pensée critique' : ''
            ].filter(Boolean),
            feedback: 'Réponse enregistrée pour évaluation',
            explanation: `Cette question ouverte de niveau ${difficultyLevel} évalue votre maîtrise complète de ${aspectName}`
        };
    }

    private generateMultipleChoice(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        const points = difficultyLevel === 'level_1' ? 2 : difficultyLevel === 'level_2' ? 4 : 6;
        
        // Utiliser le contenu pour générer des options
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const options = sentences.length >= 4 
            ? sentences.slice(0, 4).map(s => s.trim())
            : [
                `Option ${difficultyLevel} - 1`,
                `Option ${difficultyLevel} - 2`,
                `Option ${difficultyLevel} - 3`,
                `Option ${difficultyLevel} - 4`
            ];
        
        const correctAnswerIndex = Math.floor(Math.random() * options.length);
        
        return {
            id: uuidv4(),
            type: 'multiple_choice',
            question: `Question à choix multiple de niveau ${difficultyLevel} sur ${aspectName}: ${content.substring(0, 50)}...`,
            conceptId,
            points,
            aspect: aspectName,
            options,
            correctAnswer: options[correctAnswerIndex],
            feedback: 'Réponse enregistrée',
            explanation: `Cette question de niveau ${difficultyLevel} teste votre compréhension de ${aspectName}`
        };
    }

    private generateTrueFalseJustify(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        const points = difficultyLevel === 'level_1' ? 2 : difficultyLevel === 'level_2' ? 3 : 4;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const statement = sentences.length > 0 
            ? sentences[0].trim()
            : `Affirmation de niveau ${difficultyLevel} sur ${aspectName}`;
        
        return {
            id: uuidv4(),
            type: 'true_false_justify',
            question: `Vrai ou faux (niveau ${difficultyLevel}) - Justifiez votre réponse: ${statement}`,
            conceptId,
            points,
            aspect: aspectName,
            correctAnswer: Math.random() < 0.5 ? 'true' : 'false',
            evaluationCriteria: [
                'Justification claire',
                'Utilisation d\'exemples pertinents',
                difficultyLevel === 'level_3' ? 'Analyse critique' : '',
                difficultyLevel === 'level_3' ? 'Références au cours' : ''
            ].filter(Boolean),
            feedback: 'Réponse enregistrée',
            explanation: `Cette question de niveau ${difficultyLevel} évalue votre capacité à justifier votre raisonnement sur ${aspectName}`
        };
    }

    private generateAssertionReason(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        const points = difficultyLevel === 'level_1' ? 2 : difficultyLevel === 'level_2' ? 4 : 6;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Prendre deux phrases différentes pour l'assertion et la raison
        const assertion = sentences.length > 0 
            ? sentences[0].trim()
            : `Assertion de niveau ${difficultyLevel} sur ${aspectName}`;
        
        const reason = sentences.length > 1 
            ? sentences[1].trim()
            : `Raison de niveau ${difficultyLevel} concernant ${aspectName}`;
        
        return {
            id: uuidv4(),
            type: 'assertion_reason',
            question: `Niveau ${difficultyLevel} - Évaluez l'assertion et la raison suivantes:\n\nAssertion: ${assertion}\n\nRaison: ${reason}`,
            conceptId,
            points,
            aspect: aspectName,
            assertion,
            reason,
            correctAnswer: Math.random() < 0.5 ? 'assertion_correct' : 'reason_correct',
            evaluationCriteria: [
                'Compréhension de l\'assertion',
                'Analyse de la raison',
                'Lien entre assertion et raison',
                difficultyLevel === 'level_3' ? 'Analyse critique' : '',
                difficultyLevel === 'level_3' ? 'Justification détaillée' : ''
            ].filter(Boolean),
            feedback: 'Réponse enregistrée',
            explanation: `Cette question de niveau ${difficultyLevel} évalue votre capacité à analyser les relations entre assertions et raisons dans ${aspectName}`
        };
    }

    private generateFillBlank(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        const points = difficultyLevel === 'level_1' ? 2 : difficultyLevel === 'level_2' ? 3 : 4;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Créer des blancs à partir des mots clés du texte
        const sentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
        const words = sentence.split(' ');
        const keyWordIndices = [];
        
        // Sélectionner des mots clés pour les blancs (éviter les mots courts)
        for (let i = 0; i < words.length; i++) {
            if (words[i].length > 4) {
                keyWordIndices.push(i);
            }
        }
        
        // Sélectionner 2-3 mots à transformer en blancs
        const numBlanks = difficultyLevel === 'level_1' ? 1 : difficultyLevel === 'level_2' ? 2 : 3;
        const selectedIndices = keyWordIndices
            .sort(() => Math.random() - 0.5)
            .slice(0, numBlanks);
        
        const blanks = selectedIndices.map(index => ({
            answer: words[index],
            placeholder: '...',
            hint: `Indice : ${words[index].length} lettres`
        }));
        
        // Créer la question avec les blancs
        let questionText = sentence;
        selectedIndices.sort((a, b) => b - a).forEach(index => {
            const before = questionText.slice(0, questionText.indexOf(words[index]));
            const after = questionText.slice(questionText.indexOf(words[index]) + words[index].length);
            questionText = before + '_____' + after;
        });
        
        return {
            id: uuidv4(),
            type: 'fill_blank',
            question: questionText,
            conceptId,
            points,
            aspect: aspectName,
            blanks,
            correctAnswer: blanks.map(b => b.answer),
            feedback: 'Réponse enregistrée',
            explanation: `Cette question de niveau ${difficultyLevel} teste votre compréhension du vocabulaire de ${aspectName}`,
            difficultyLevel
        };
    }

    private generateMatrixQuestion(conceptId: string, aspectName: AspectName, content: string, difficultyLevel: DifficultyLevel): QuizQuestion {
        const points = difficultyLevel === 'level_1' ? 3 : difficultyLevel === 'level_2' ? 4 : 5;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Créer une matrice de concepts reliés
        const matrix: string[][] = [];
        const size = difficultyLevel === 'level_1' ? 2 : difficultyLevel === 'level_2' ? 3 : 4;
        
        // Générer les en-têtes de ligne et de colonne
        const headers = sentences
            .map(s => s.split(' ').slice(0, 3).join(' ')) // Prendre les 3 premiers mots
            .slice(0, size);
            
        // Créer la matrice avec les relations
        matrix.push([''].concat(headers)); // En-tête des colonnes
        for (let i = 0; i < size; i++) {
            const row = [headers[i]]; // En-tête de la ligne
            for (let j = 0; j < size; j++) {
                row.push(i === j ? 'X' : ''); // Diagonale marquée par défaut
            }
            matrix.push(row);
        }
        
        return {
            id: uuidv4(),
            type: 'matrix',
            question: `Complétez la matrice de relations pour ${aspectName}. Marquez 'X' où il y a une relation directe :`,
            conceptId,
            points,
            aspect: aspectName,
            matrix,
            correctAnswer: matrix.map(row => row.join(',')),
            feedback: 'Réponse enregistrée',
            explanation: `Cette question de niveau ${difficultyLevel} évalue votre compréhension des relations dans ${aspectName}`,
            difficultyLevel
        };
    }

    private generateMatchingPairs(content: string, numberOfPairs: number): Array<{ term: string; definition: string }> {
        // Extraire des phrases du contenu
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const pairs: Array<{ term: string; definition: string }> = [];

        // Créer des paires terme-définition
        for (let i = 0; i < Math.min(numberOfPairs, sentences.length); i++) {
            const sentence = sentences[i].trim();
            const parts = sentence.split(',').map(p => p.trim());
            
            if (parts.length >= 2) {
                pairs.push({
                    term: parts[0],
                    definition: parts.slice(1).join(', ')
                });
            } else {
                // Si la phrase ne peut pas être divisée, créer une paire artificielle
                const words = sentence.split(' ');
                const midPoint = Math.floor(words.length / 2);
                pairs.push({
                    term: words.slice(0, midPoint).join(' '),
                    definition: words.slice(midPoint).join(' ')
                });
            }
        }

        return pairs;
    }

    private generateOrderingQuestion(content: string, difficulty: DifficultyLevel): { items: string[]; correctOrder: string[] } {
        // Extraire des phrases du contenu
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Sélectionner un nombre d'éléments basé sur la difficulté
        const numberOfItems = difficulty === 'level_1' ? 3 : difficulty === 'level_2' ? 4 : 5;
        const selectedSentences = sentences.slice(0, numberOfItems).map(s => s.trim());
        
        // Créer l'ordre correct et mélanger les items
        const correctOrder = [...selectedSentences];
        const items = [...selectedSentences].sort(() => Math.random() - 0.5);
        
        return { items, correctOrder: correctOrder.map(item => item.toString()) }; // Correction du type de retour pour correctOrder
    }
}

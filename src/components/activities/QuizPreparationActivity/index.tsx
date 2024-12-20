import { useState } from 'react';
import { IntroductionPage } from './IntroductionPage';
import { QuizPreparation } from '../quiz/QuizPreparation';
import { GPTQuizPreparation } from './GPTQuizPreparation';
import { types } from './types';

export function QuizPreparationActivity({ data }: { data: types.QuizPreparationActivityProps['data'] }) {
  const [selectedVersion, setSelectedVersion] = useState<'intro' | 'halpi' | 'gpt'>('intro');

  const handleVersionSelect = (version: 'halpi' | 'gpt') => {
    setSelectedVersion(version);
  };

  if (selectedVersion === 'halpi') {
    return <QuizPreparation courseId={data.courseId} pathId={data.chapterId} />;
  }

  if (selectedVersion === 'gpt') {
    const gptData = {
      step: {
        id: 'gpt-quiz-prep',
        title: 'Préparation de Quiz avec GPTs',
        completed: false
      },
      phase: {
        id: 'quiz-prep',
        title: 'Préparation de Quiz'
      },
      pathId: data.chapterId, // Utiliser chapterId comme identifiant de chemin
      pathData: {
        courseId: data.courseId,
        title: data.courseName,
        chapterId: data.chapterId,
        chapterNumber: data.chapterNumber
      }
    };
    return <GPTQuizPreparation data={gptData} />;
  }

  return (
    <IntroductionPage
      data={data}
      onVersionSelect={handleVersionSelect}
    />
  );
}

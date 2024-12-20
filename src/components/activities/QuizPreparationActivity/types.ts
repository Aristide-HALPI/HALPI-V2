export namespace types {
  export interface QuizPreparationActivityProps {
    data: {
      courseId: string;
      courseName: string;
      chapterId: string;
      chapterNumber: number;
      phase?: {
        chapters?: Array<{
          steps: Array<{
            id: string;
            title: string;
            completed: boolean;
            chapterId?: string;
          }>;
        }>;
        steps?: Array<{
          id: string;
          title: string;
          completed: boolean;
          chapterId?: string;
        }>;
      };
    };
  }
}

import { createFileRoute } from '@tanstack/react-router';
import { BookOpen, Plus } from 'lucide-react';
import { Button, Card, CardContent } from '../../../components/ui';

export const Route = createFileRoute('/_authenticated/journal/')({
  component: JournalPage,
});

const JournalPage = () => (
  <div className="p-6 max-w-6xl mx-auto">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Journal</h1>
        <p className="text-muted">Document your travel memories</p>
      </div>
      <Button leftIcon={<Plus size={18} />}>New Entry</Button>
    </div>

    <Card>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-4">
            <BookOpen className="text-accent-hover" size={40} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No journal entries
          </h3>
          <p className="text-muted mb-6 max-w-sm">
            Capture your travel experiences with photos and stories
          </p>
          <Button leftIcon={<Plus size={18} />}>Write Your First Entry</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

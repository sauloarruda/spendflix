import { Button } from 'primereact/button';
import { FloatLabel } from 'primereact/floatlabel';
import { InputTextarea } from 'primereact/inputtextarea';
import { useRef, useState } from 'react';

import { TransactionDto } from '@/actions/transactions';

type TransactionNotesProps = {
  transaction: TransactionDto;
  onChange: (value: string | null) => void;
};
export default function TransactionNotes({ transaction, onChange }: TransactionNotesProps) {
  const [notes, setNotes] = useState(transaction.notes);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  function handleAddNotes() {
    setNotes('');
    setTimeout(() => noteRef.current?.focus(), 200);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const { value } = e.target;
    setNotes(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onChange(value);
    }, 1000);
  }

  function handleBlur() {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    onChange(notes);
  }

  function handleClearNotes() {
    setNotes(null);
    onChange(null);
  }

  if (notes !== null) {
    return (
      <div className="flex w-full gap-2">
        <FloatLabel className="grow">
          <InputTextarea
            ref={noteRef}
            autoResize
            value={notes}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={1}
            className="w-full"
            id="notes"
          />
          <label htmlFor="notes">Notas</label>
        </FloatLabel>
        <Button
          icon="pi pi-trash"
          size="small"
          rounded
          severity="danger"
          onClick={handleClearNotes}
        />
      </div>
    );
  }
  return <Button icon="pi pi-clipboard" label="Adicionar Notas" onClick={handleAddNotes} />;
}

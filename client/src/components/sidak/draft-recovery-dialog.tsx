import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, RotateCcw, Trash2 } from "lucide-react";
import { formatDraftTimestamp } from "@/hooks/use-sidak-draft";

interface DraftRecoveryDialogProps {
  open: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  timestamp: string | null;
  formType: string;
}

export function DraftRecoveryDialog({
  open,
  onRestore,
  onDiscard,
  timestamp,
  formType
}: DraftRecoveryDialogProps) {
  const getFormName = (type: string) => {
    switch (type) {
      case "fatigue": return "SIDAK Fatigue";
      case "roster": return "SIDAK Roster";
      case "seatbelt": return "SIDAK Seatbelt";
      case "antrian": return "SIDAK Antrian";
      case "apd": return "SIDAK APD";
      case "jarak": return "SIDAK Jarak";
      case "kecepatan": return "SIDAK Kecepatan";
      case "pencahayaan": return "SIDAK Pencahayaan";
      case "loto": return "SIDAK LOTO";
      case "digital": return "SIDAK Digital";
      case "workshop": return "SIDAK Workshop";
      default: return `SIDAK ${type}`;
    }
  };

  const formName = getFormName(formType);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Draft {formName} Ditemukan
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-2">
            <p>
              Ada draft {formName} yang belum selesai dari sesi sebelumnya.
            </p>
            {timestamp && (
              <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <strong>Terakhir disimpan:</strong> {formatDraftTimestamp(timestamp)}
              </p>
            )}
            <p className="text-sm">
              Apakah Anda ingin melanjutkan draft tersebut atau memulai form baru?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={onDiscard}
            className="flex items-center gap-2"
            data-testid="button-discard-draft"
          >
            <Trash2 className="h-4 w-4" />
            Hapus & Mulai Baru
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onRestore}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            data-testid="button-restore-draft"
          >
            <RotateCcw className="h-4 w-4" />
            Lanjutkan Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

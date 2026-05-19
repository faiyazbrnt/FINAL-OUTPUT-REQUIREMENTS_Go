import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ImportExportButtonProps = {
  disabled: boolean;
  onImportData: (file: File) => Promise<void>;
  onExportPdf: () => Promise<void>;
  onExportCsv: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  onDownloadCsvTemplate: () => Promise<void>;
  onDownloadExcelTemplate: () => Promise<void>;
};

const ImportExportButton = ({
  disabled,
  onImportData,
  onExportPdf,
  onExportCsv,
  onExportExcel,
  onDownloadCsvTemplate,
  onDownloadExcelTemplate
}: ImportExportButtonProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, minWidth: 248 });
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuId = useId();

  const updateMenuPosition = (): void => {
    if (!triggerRef.current) {
      return;
    }

    const viewportPadding = 12;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const measuredWidth = menuRef.current?.offsetWidth ?? 0;
    const desiredWidth = Math.max(triggerRect.width, 248, measuredWidth);
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
    const shouldOpenAbove = menuHeight > 0 && spaceBelow < menuHeight && triggerRect.top > spaceBelow;

    let left = triggerRect.right - desiredWidth;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - desiredWidth - viewportPadding));

    const top = shouldOpenAbove
      ? Math.max(viewportPadding, triggerRect.top - menuHeight - 8)
      : triggerRect.bottom + 8;

    setMenuPosition({
      top,
      left,
      minWidth: Math.max(triggerRect.width, 248)
    });
  };

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent): void => {
      if (!menuContainerRef.current) {
        return;
      }

      const target = event.target as Node;
      if (!menuContainerRef.current.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuPosition();
    const rafId = window.requestAnimationFrame(updateMenuPosition);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  const runAction = async (actionLabel: string, action: () => Promise<void>): Promise<void> => {
    setBusyAction(actionLabel);
    try {
      await action();
      setIsOpen(false);
    } finally {
      setBusyAction(null);
    }
  };

  const isBusy = busyAction !== null;

  return (
    <div className="import-export-wrap" ref={menuContainerRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }
          void runAction("import", async () => onImportData(file));
          event.currentTarget.value = "";
        }}
      />

      <button
        ref={triggerRef}
        type="button"
        className="ui-button ui-button-secondary w-full import-export-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={disabled || isBusy}
        onClick={() => {
          setIsOpen((current) => !current);
        }}
      >
        {isBusy ? "Processing..." : "Import/Export"}
      </button>

      {isOpen &&
        createPortal(
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            className="import-export-menu"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              minWidth: `${menuPosition.minWidth}px`
            }}
          >
            <p className="import-export-heading">Import</p>
            <button
              type="button"
              role="menuitem"
              className="import-export-item"
              disabled={isBusy}
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              Import Data
            </button>

            <p className="import-export-heading">Export</p>
            <button
              type="button"
              role="menuitem"
              className="import-export-item"
              disabled={isBusy}
              onClick={() => {
                void runAction("export-pdf", onExportPdf);
              }}
            >
              Export as PDF
            </button>
            <button
              type="button"
              role="menuitem"
              className="import-export-item"
              disabled={isBusy}
              onClick={() => {
                void runAction("export-csv", onExportCsv);
              }}
            >
              Export as CSV
            </button>
            <button
              type="button"
              role="menuitem"
              className="import-export-item"
              disabled={isBusy}
              onClick={() => {
                void runAction("export-excel", onExportExcel);
              }}
            >
              Export as Excel (.xlsx)
            </button>

            <p className="import-export-heading">Templates</p>
            <button
              type="button"
              role="menuitem"
              className="import-export-item"
              disabled={isBusy}
              onClick={() => {
                void runAction("template-csv", onDownloadCsvTemplate);
              }}
            >
              Download CSV Template
            </button>
            <button
              type="button"
              role="menuitem"
              className="import-export-item"
              disabled={isBusy}
              onClick={() => {
                void runAction("template-xlsx", onDownloadExcelTemplate);
              }}
            >
              Download Excel Template
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ImportExportButton;

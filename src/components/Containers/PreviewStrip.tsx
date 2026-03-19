import { observer } from "mobx-react-lite";
import ResizableContainer from "../ResizableContainer";
import SimpleButton from "../Atomic/SimpleButton";
import type { PropsWithChildren } from "react";




export const PreviewStrip = ({ children }: PropsWithChildren) => {
    return (
        <div className="d-flex flex-column gap-3">
            <ResizableContainer initialHeight={200}>
                <div className="d-flex overflow-auto gap-2 h-100">
                    {children}
                </div>
            </ResizableContainer>
        </div>
    );
};


type ShotStripItemProps = PropsWithChildren<{
    isSelected?: boolean;
    onClick?: () => void;
}>;

export const ShotStripItem = ({ children, isSelected = false, onClick }: ShotStripItemProps) => {
    return (
        <div
            onClick={onClick}
            className="flex-shrink-0 position-relative d-flex align-items-center justify-content-center"
            style={{
                height: '100%',
                cursor: 'pointer',
                borderWidth: isSelected ? 2 : 0,
                borderColor: isSelected ? '#04914a' : '#dee2e6',
                borderStyle: 'solid',
            }}
        >
            {children}
        </div>
    );
};

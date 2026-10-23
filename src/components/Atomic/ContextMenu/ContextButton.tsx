import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import * as ContextMenu from '@radix-ui/react-context-menu';
import { MenuItemIcon } from "../../MediaFolderGallery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ContextButtonProps {
    class_extra?: string;
    onSelect: () => void;
    icon: IconDefinition;
    label: string;
}

export const ContextButton: React.FC<ContextButtonProps> = ({
    class_extra = '',
    onSelect,
    icon,
    label
}) => {
    return (
        <ContextMenu.Item
            className={`ContextMenuItem ${class_extra}`.trim()}
            onSelect={onSelect}
        >
            <MenuItemIcon>        <FontAwesomeIcon icon={icon} />      </MenuItemIcon>
            {label}
        </ContextMenu.Item>
    );
};
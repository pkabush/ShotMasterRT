import React, { createContext, useContext } from "react";
import Accordion from "react-bootstrap/Accordion";
import AccordionContext from "react-bootstrap/AccordionContext";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import { useAccordionButton } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight } from "@fortawesome/free-solid-svg-icons";

const OPEN_COLOR = "rgba(59, 115, 171, 0.57)";
const CLOSED_COLOR = "rgba(0, 0, 0, 0)";

/* -------------------- Context -------------------- */

interface AccordionCardContextValue {
    eventKey: string;
}

const AccordionCardContext = createContext<AccordionCardContextValue | null>(null);

const useAccordionCard = () => {
    const ctx = useContext(AccordionCardContext);
    if (!ctx) {
        throw new Error("AccordionCard components must be used inside AccordionCard");
    }
    return ctx;
};

/* -------------------- Root -------------------- */

interface AccordionCardProps {
    eventKey: string;
    children: React.ReactNode;
}

const AccordionCardRoot: React.FC<AccordionCardProps> = ({
    eventKey,
    children,
}) => {
    return (
        <AccordionCardContext.Provider value={{ eventKey }}>
            <Card>{children}</Card>
        </AccordionCardContext.Provider>
    );
};

/* -------------------- Header -------------------- */

interface HeaderProps {
    children?: React.ReactNode;
    openColor?: string;
    closedColor?: string;
    onToggle?: (isOpen: boolean) => void; // ✅ added
}

const Header: React.FC<HeaderProps> = ({
    children,
    openColor = OPEN_COLOR,
    closedColor = CLOSED_COLOR,
    onToggle,
}) => {
    const { eventKey } = useAccordionCard();
    const { activeEventKey } = useContext(AccordionContext);

    const isOpen = activeEventKey === eventKey;

    // ✅ run callback on user click, not render
    const toggle = useAccordionButton(eventKey, () => {
        onToggle?.(!isOpen);
    });

    let headerContent: React.ReactNode = null;
    let controls: React.ReactNode = null;

    React.Children.forEach(children, (child: any) => {
        if (child?.type === Controls) {
            controls = child;
        } else {
            headerContent = child;
        }
    });

    return (
        <Stack
            direction="horizontal"
            className="w-100 align-items-center py-0"
            style={{
                backgroundColor: isOpen ? openColor : closedColor,
                cursor: "pointer",
                borderRadius: 4,
                height: 31,
            }}
        >
            <div onClick={toggle} style={{ paddingLeft: 5 }}>
                <FontAwesomeIcon
                    icon={faCaretRight}
                    style={{
                        width: 16,
                        transition: "transform 0.2s ease",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                />
            </div>

            <div onClick={toggle} style={{
                flex: 1,
                paddingLeft: 5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
            }}>
                {headerContent ?? eventKey}
            </div>

            {controls}
        </Stack>
    );
};

/* -------------------- Controls -------------------- */

const Controls: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    );
};

/* -------------------- Body -------------------- */

interface BodyProps {
    children: React.ReactNode;
}

const Body: React.FC<BodyProps> = ({ children }) => {
    const { eventKey } = useAccordionCard();

    return (
        <Accordion.Collapse eventKey={eventKey}>
            <Card.Body className="p-0">
                {children}
            </Card.Body>
        </Accordion.Collapse>
    );
};

/* -------------------- Attach subcomponents -------------------- */

export const AccordionCard = Object.assign(AccordionCardRoot, {
    Header,
    Controls,
    Body,
});
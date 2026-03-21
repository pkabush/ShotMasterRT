import React, { createContext, useContext } from "react";
import Accordion from "react-bootstrap/Accordion";
import AccordionContext from "react-bootstrap/AccordionContext";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import { useAccordionButton } from "react-bootstrap";

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

const Header: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { eventKey } = useAccordionCard();
    const { activeEventKey } = useContext(AccordionContext);

    const isOpen = activeEventKey === eventKey;
    const toggle = useAccordionButton(eventKey);

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
                backgroundColor: isOpen ? OPEN_COLOR : CLOSED_COLOR,
                cursor: "pointer",
                borderRadius: 4,
            }}
        >
            <div onClick={toggle} style={{ flex: 1, paddingLeft: 10 }}>
                {headerContent ?? eventKey}
            </div>

            {controls}
        </Stack>
    );
};

/* -------------------- Controls -------------------- */

const Controls: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    );
};

/* -------------------- Body -------------------- */

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
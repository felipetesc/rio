import { componentsById } from '../componentManagement';
import { ComponentId } from '../dataModels';
import { setConnectionLostPopupVisibleUnlessGoingAway } from '../rpc';
import { ComponentBase, ComponentState } from './componentBase';

export type FundamentalRootComponentState = ComponentState & {
    _type_: 'FundamentalRootComponent-builtin';
    content: ComponentId;
    connection_lost_component: ComponentId;
    dev_tools: ComponentId | null;
};

export class FundamentalRootComponent extends ComponentBase {
    state: Required<FundamentalRootComponentState>;

    public overlaysContainer: HTMLElement;

    private userContentScroller: HTMLElement;
    private userRootContainer: HTMLElement;
    private connectionLostPopupContainer: HTMLElement;
    private devToolsContainer: HTMLElement;

    createElement(): HTMLElement {
        let element = document.createElement('div');
        element.classList.add('rio-fundamental-root-component');

        element.innerHTML = `
            <div class="rio-user-content-scroller">
                <div class="rio-user-root-container"></div>
            </div>
            <div class="rio-overlays-container"></div>
            <div class="rio-connection-lost-popup-container"></div>
            <div class="rio-dev-tools-container"></div>
        `;

        this.overlaysContainer = element.querySelector(
            '.rio-overlays-container'
        ) as HTMLElement;

        this.userContentScroller = element.querySelector(
            '.rio-user-content-scroller'
        ) as HTMLElement;
        this.userRootContainer = element.querySelector(
            '.rio-user-root-container'
        ) as HTMLElement;
        this.connectionLostPopupContainer = element.querySelector(
            '.rio-connection-lost-popup-container'
        ) as HTMLElement;
        this.devToolsContainer = element.querySelector(
            '.rio-dev-tools-container'
        ) as HTMLElement;

        return element;
    }

    updateElement(
        deltaState: FundamentalRootComponentState,
        latentComponents: Set<ComponentBase>
    ): void {
        super.updateElement(deltaState, latentComponents);

        // User components
        if (deltaState.content !== undefined) {
            this.replaceOnlyChild(
                latentComponents,
                deltaState.content,
                this.userRootContainer
            );
        }

        // Connection lost popup
        if (deltaState.connection_lost_component !== undefined) {
            let oldConnectionLostPopup =
                this.connectionLostPopupContainer.firstElementChild;
            let connectionLostPopupVisible =
                oldConnectionLostPopup === null
                    ? false // It's hidden by default
                    : oldConnectionLostPopup.classList.contains(
                          'rio-connection-lost-popup-visible'
                      );

            this.replaceOnlyChild(
                latentComponents,
                deltaState.connection_lost_component,
                this.connectionLostPopupContainer
            );

            let connectionLostPopupElement =
                this.connectionLostPopupContainer.firstElementChild!;
            connectionLostPopupElement.classList.add(
                'rio-connection-lost-popup'
            );

            // Looking up elements via selector is wonky if the element has only
            // just been added. Give the browser time to update.
            requestAnimationFrame(() =>
                setConnectionLostPopupVisibleUnlessGoingAway(
                    connectionLostPopupVisible
                )
            );
        }

        // Dev tools sidebar
        if (deltaState.dev_tools !== undefined) {
            this.replaceOnlyChild(
                latentComponents,
                deltaState.dev_tools,
                this.devToolsContainer
            );

            if (deltaState.dev_tools !== null) {
                let devTools = componentsById[deltaState.dev_tools]!;
                devTools.element.classList.add('rio-dev-tools');
            }

            // Enable or disable the user content scroller depending on whether
            // there are dev-tools
            this.element.dataset.hasDevTools = `${
                deltaState.dev_tools !== null
            }`;
        }
    }
}

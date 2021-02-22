import traverse from '@babel/traverse';

import { DefinitionsList } from './entryDefinitionsMap';
import { parseCodeToAST, buildVisitor } from './astBuilder';
import {
    ABSTRACTION_LEVELS,
    rebuildConfigForAbstractionLevel
} from './abstractionLevelsConfigurator';
import FlowTreeModifier from './FlowTreeModifier';
import {
    DEFINED_MODIFIERS,
    MODIFIER_PRESETS,
    destructionModifier,
    expressionCallbacksModifier,
    arrowFunctionReturnModifier
} from './modifiers/modifiersFactory';
import { TOKEN_TYPES } from '../shared/constants';
import { logError } from '../shared/utils/logger';

// 将babel生成的ast树astTree转化为jstoflowchart需要的对象
const buildFlowTree = (astTree, astVisitorConfig) => {
    const treeNodes = [];
    // babel的遍历节点用的API
    traverse(astTree, buildVisitor(astVisitorConfig, treeNodes));

    const root = (treeNodes.length && treeNodes[0]) || {};
    return root.type === TOKEN_TYPES.PROGRAM
        ? root
        : { name: 'Root', type: TOKEN_TYPES.PROGRAM, body: treeNodes };
};

export default function flowTreeBuilder({ astParser = {}, astVisitor = {} } = {}) {
    const astParserConfig = {
        ...astParser
    };

    const astVisitorConfig = {
        definitionsMap: [...DefinitionsList],
        globalIgnore: null,
        ...astVisitor
    };

    const defaultModifier = createFlowTreeModifier();
    defaultModifier.setModifier(expressionCallbacksModifier());
    defaultModifier.setModifier(arrowFunctionReturnModifier());

    return {
        setAbstractionLevel(level) {
            astVisitorConfig.definitionsMap = rebuildConfigForAbstractionLevel(level);
        },

        resetAbstractionLevelToNormal() {
            astVisitorConfig.definitionsMap = [...DefinitionsList];
        },

        setIgnoreFilter(fn) {
            astVisitorConfig.globalIgnore = fn;
        },

        build(code) {
            // console.log( 'this.buildAst(code):', this.buildAst(code) )
            // console.log( 'this.buildFlowTreeFromAst( this.buildAst(code) ):', this.buildFlowTreeFromAst( this.buildAst(code) ) )
            return this.buildFlowTreeFromAst( this.buildAst(code) );
        },

        buildAst(code) {
            return parseCodeToAST(code, astParserConfig);
        },

        buildFlowTreeFromAst(ast) {
            let flowTree = [];

            try {
                // 将babel生成的ast树转化为jstoflowchart需要的对象
                // console.log( 'astVisitorConfig:', astVisitorConfig )
                flowTree = buildFlowTree(ast, astVisitorConfig)
                // 不知道是用来干啥的，注释掉了也没啥影响
                defaultModifier.applyToFlowTree(flowTree)
                // console.log( 'flowTree:', flowTree )
            } catch (e) {
                logError('Error at buildFlowTreeFromAst' + e.message, e.stack);
                throw e;
            }

            return flowTree;
        }
    };
};
//TODO: seems redundant abstraction, refactor
export const createFlowTreeModifier = () => {
    const modifiers = FlowTreeModifier();

    return {
        setModifier(modifier) {
            modifiers.addModifier(modifier);
        },

        registerNewModifier(test, updates) {
            modifiers.create(test, updates);
        },

        destructNodeTree(test, newNameFn) {
            this.setModifier(destructionModifier(test, newNameFn));
        },

        applyToFlowTree(flowTree) {
            modifiers.applyTo(flowTree);
            return flowTree;
        }
    };
};


export { DEFINED_MODIFIERS, MODIFIER_PRESETS, ABSTRACTION_LEVELS };

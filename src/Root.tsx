import { Composition } from "remotion";
import { MergeConflictResolution, MERGE_CONFLICT_TOTAL_FRAMES } from "./MergeConflictResolution";
import { MergeConflictResolutionV2, MERGE_CONFLICT_V2_TOTAL_FRAMES } from "./MergeConflictResolutionV2";
import { MergeConflictResolutionV3, MERGE_CONFLICT_V3_TOTAL_FRAMES } from "./MergeConflictResolutionV3";
import { MergeConflictResolutionV4, MERGE_CONFLICT_V4_TOTAL_FRAMES } from "./MergeConflictResolutionV4";
import { MergeConflictResolutionV5, MERGE_CONFLICT_V5_TOTAL_FRAMES } from "./MergeConflictResolutionV5";
import { RateLimitWarning, RATE_LIMIT_TOTAL_FRAMES } from "./RateLimitWarning";
import { KeepShipping, KEEP_SHIPPING_TOTAL_FRAMES } from "./KeepShipping";
import { DidThisEverHappenToYou, DID_THIS_TOTAL_FRAMES } from "./DidThisEverHappenToYou";
import { DidThisEverHappenToYouFast, DID_THIS_FAST_TOTAL_FRAMES } from "./DidThisEverHappenToYouFast";
import { CodeRabbitIntro } from "./CodeRabbitIntro";
import { ImpactSlicerViz } from "./ImpactSlicerViz";
import { ASTWalkViz } from "./ASTWalkViz";
import { ReviewSystemsCompare } from "./ReviewSystemsCompare";
import { CustomerQuote } from "./CustomerQuote";
import { MultiRepoViz } from "./MultiRepoViz";
import { MultiRepoVizV2 } from "./MultiRepoVizV2";
import { ConfigOnMainViz } from "./ConfigOnMainViz";
import { BreakingChangeAlarm } from "./BreakingChangeAlarm";
import { UsageBasedAddonIntro } from "./UsageBasedAddonIntro";
import { AgentsCookSlide } from "./AgentsCookSlide";
import { AlternativeCook } from "./AlternativeCook";
import { CodeRabbitShips } from "./CodeRabbitShips";
import { InnerOuterLoopViz, INNER_OUTER_LOOP_VIZ_TOTAL_FRAMES } from "./InnerOuterLoopViz";
import { RabbitAgentLoopViz, RABBIT_AGENT_LOOP_TOTAL_FRAMES } from "./RabbitAgentLoopViz";
import { RabbitAgentLoopV2, RABBIT_AGENT_LOOP_V2_TOTAL_FRAMES } from "./RabbitAgentLoopV2";
import { RabbitAgentLoopV3, RABBIT_AGENT_LOOP_V3_TOTAL_FRAMES } from "./RabbitAgentLoopV3";
import { RabbitAgentLoopV4, RABBIT_AGENT_LOOP_V4_TOTAL_FRAMES } from "./RabbitAgentLoopV4";
import { RabbitAgentLoopV5, RABBIT_AGENT_LOOP_V5_TOTAL_FRAMES } from "./RabbitAgentLoopV5";
import { RabbitAgentLoopV6, RABBIT_AGENT_LOOP_V6_TOTAL_FRAMES } from "./RabbitAgentLoopV6";
import { SuperDeveloper, SUPER_DEVELOPER_TOTAL_FRAMES } from "./SuperDeveloper";
import { PlanSlackDemo, PLAN_SLACK_DEMO_TOTAL_FRAMES } from "./PlanSlackDemo";
import { PlanSlackDemoV2, PLAN_SLACK_DEMO_V2_TOTAL_FRAMES } from "./PlanSlackDemoV2";
import { PlanSlackDemoV3, PLAN_SLACK_DEMO_V3_TOTAL_FRAMES } from "./PlanSlackDemoV3";
import {
  TerminalTyping,
  INSTALL_TWO_COMMANDS_TOTAL_FRAMES,
  BENCH_SETUP_TOTAL_FRAMES,
  SCHEDULE_BENCH_TOTAL_FRAMES,
  INSTALL_COMMANDS,
  BENCH_SETUP_COMMANDS,
  SCHEDULE_BENCH_COMMANDS,
} from "./TerminalTyping";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CodeRabbitIntro"
        component={CodeRabbitIntro}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LinkedRepoIntro"
        component={CodeRabbitIntro}
        defaultProps={{ tagline: "Introducing Linked Repositories in CodeRabbit" }}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ImpactSlicerViz"
        component={ImpactSlicerViz}
        durationInFrames={3240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ASTWalkViz"
        component={ASTWalkViz}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ReviewSystemsCompare"
        component={ReviewSystemsCompare}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="CustomerQuote"
        component={CustomerQuote}
        durationInFrames={510}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MultiRepoViz"
        component={MultiRepoViz}
        durationInFrames={420}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="MultiRepoVizV2"
        component={MultiRepoVizV2}
        durationInFrames={560}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="BreakingChangeAlarm"
        component={BreakingChangeAlarm}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="ConfigOnMainViz"
        component={ConfigOnMainViz}
        durationInFrames={400}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KeepShipping"
        component={KeepShipping}
        durationInFrames={KEEP_SHIPPING_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RateLimitWarning"
        component={RateLimitWarning}
        durationInFrames={RATE_LIMIT_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DidThisEverHappenToYou"
        component={DidThisEverHappenToYou}
        durationInFrames={DID_THIS_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DidThisEverHappenToYouFast"
        component={DidThisEverHappenToYouFast}
        durationInFrames={DID_THIS_FAST_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="UsageBasedAddonIntro"
        component={UsageBasedAddonIntro}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AgentsCookSlide"
        component={AgentsCookSlide}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AlternativeCook"
        component={AlternativeCook}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CodeRabbitShips"
        component={CodeRabbitShips}
        durationInFrames={330}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="InnerOuterLoopViz"
        component={InnerOuterLoopViz}
        durationInFrames={INNER_OUTER_LOOP_VIZ_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RabbitAgentLoopViz"
        component={RabbitAgentLoopViz}
        durationInFrames={RABBIT_AGENT_LOOP_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RabbitAgentLoopV2"
        component={RabbitAgentLoopV2}
        durationInFrames={RABBIT_AGENT_LOOP_V2_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RabbitAgentLoopV3"
        component={RabbitAgentLoopV3}
        durationInFrames={RABBIT_AGENT_LOOP_V3_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RabbitAgentLoopV4"
        component={RabbitAgentLoopV4}
        durationInFrames={RABBIT_AGENT_LOOP_V4_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RabbitAgentLoopV5"
        component={RabbitAgentLoopV5}
        durationInFrames={RABBIT_AGENT_LOOP_V5_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RabbitAgentLoopV6"
        component={RabbitAgentLoopV6}
        durationInFrames={RABBIT_AGENT_LOOP_V6_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PlanSlackDemo"
        component={PlanSlackDemo}
        durationInFrames={PLAN_SLACK_DEMO_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PlanSlackDemoV2"
        component={PlanSlackDemoV2}
        durationInFrames={PLAN_SLACK_DEMO_V2_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PlanSlackDemoV3"
        component={PlanSlackDemoV3}
        durationInFrames={PLAN_SLACK_DEMO_V3_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SuperDeveloper"
        component={SuperDeveloper}
        durationInFrames={SUPER_DEVELOPER_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="InstallTwoCommands"
        component={TerminalTyping}
        durationInFrames={INSTALL_TWO_COMMANDS_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          commands: INSTALL_COMMANDS,
          title: "~ / my-saas",
        }}
      />
      <Composition
        id="BenchSetup"
        component={TerminalTyping}
        durationInFrames={BENCH_SETUP_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          commands: BENCH_SETUP_COMMANDS,
          title: "~ / custom-model-bench",
        }}
      />
      <Composition
        id="ScheduleBench"
        component={TerminalTyping}
        durationInFrames={SCHEDULE_BENCH_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          commands: SCHEDULE_BENCH_COMMANDS,
          title: "~ / custom-model-bench",
        }}
      />
      <Composition
        id="MergeConflictResolution"
        component={MergeConflictResolution}
        durationInFrames={MERGE_CONFLICT_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MergeConflictResolutionV2"
        component={MergeConflictResolutionV2}
        durationInFrames={MERGE_CONFLICT_V2_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MergeConflictResolutionV3"
        component={MergeConflictResolutionV3}
        durationInFrames={MERGE_CONFLICT_V3_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MergeConflictResolutionV4"
        component={MergeConflictResolutionV4}
        durationInFrames={MERGE_CONFLICT_V4_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MergeConflictResolutionV5"
        component={MergeConflictResolutionV5}
        durationInFrames={MERGE_CONFLICT_V5_TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};

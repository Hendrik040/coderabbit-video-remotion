import { Composition } from "remotion";
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
    </>
  );
};

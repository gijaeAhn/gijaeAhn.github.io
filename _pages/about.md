---
layout: about
title: about
permalink: /
subtitle:

profile:
  align: right
  image: me.jpg
  image_circular: true # crops the image to make it circular

selected_papers: false # includes a list of papers marked as "selected={true}"
social: true # includes social icons at the bottom of the page

announcements:
  enabled: false # includes a list of news items
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 5 # leave blank to include all the news in the `_news` folder

latest_posts:
  enabled: false
  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
  limit: 3 # leave blank to include all the blog posts
---

Hi! I’m **Gijae Ahn**, a robotics engineer aiming to solve problems people face in their daily lives by building robots that can help with physical tasks. I have been pursuing this vision by exploring robotic manipulation from multiple perspectives.

Through projects at my former lab, most notably RoboCup@Home under the supervision of **Prof. Seung-Joon Yi**, I designed, planned, and controlled robotic arms tailored for everyday assistance in home environments. Separately, in collaboration with **Prof. Jungwon Seo**, I investigated dynamic manipulation techniques that enable robots to transport low-profile objects in a non-prehensile manner, broadening my understanding of contact mechanics.

Since July 2026, I have been a research intern at **OMRON SINIC X**, where my research focuses on dynamic collaborative object transfer using a hierarchical framework that combines diffusion models with model-based control.

## **Competitions**

<div class="about-entry">
  <div class="about-entry-media about-entry-placeholder" aria-hidden="true"></div>
  <div class="about-entry-body">
    <h3>RoboCup@Home 2026 (Incheon) <br><strong>1st Place</strong></h3>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2025_robocup.gif" class="img-fluid rounded z-depth-1" alt="RoboCup@Home 2025" avoid_scaling=true %}
  </div>
  <div class="about-entry-body">
    <h3>RoboCup@Home 2025 (Salvador) <br><strong>1st Place</strong></h3>
    <p>
      At RoboCup@Home 2025, our team built the entire robot system in-house and demonstrated strong all-around performance. The robot featured two compliant manipulators that smoothly carried out manipulation tasks, with my contributions focused on arm design and control, motion planning, and integration with the robot’s task execution pipeline.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2024_robocup.gif" class="img-fluid rounded z-depth-1" alt="RoboCup@Home 2024" %}
  </div>
  <div class="about-entry-body">
    <h3>RoboCup@Home 2024 (Eindhoven) <br><strong>2nd Place</strong></h3>
    <p>
      Our team improved the robot’s hardware and overall system stability from the previous competition, while also deploying a local language model for complex natural-language-based task planning. I contributed by developing arm controllers, motion planning modules, and control API interfaces.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2023_robocup.gif" class="img-fluid rounded z-depth-1" alt="RoboCup@Home 2023" avoid_scaling=true %}
  </div>
  <div class="about-entry-body">
    <h3>RoboCup@Home 2023 (Bordeaux) <br><strong>1st Place</strong></h3>
    <p>
      As a lab intern, I contributed to robot hardware engineering and system integration. I also tested algorithms shared
      across two robot platforms, modified them to work reliably on both systems, and provided feedback for further
      improvement.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2024_zeus.jpg" class="img-fluid rounded z-depth-1" alt="ZEUS Industrial Robot ZERO Mission Challenge 2024" avoid_scaling=true cache_bust=true %}
  </div>
  <div class="about-entry-body">
    <h3>ZEUS ZERO Mission Challenge 2024 <br><strong>1st Place</strong> (Presidential Award, Korea)</h3>
    <p>
      <!-- Developed an AI bartender robot that integrates LLM-based interaction with robotic manipulation for drink-serving tasks as a team leader. I implemented the arm controller, motion planning module, and LLM-based interaction pipeline, enabling the robot to understand user requests and execute corresponding bartender actions. -->
      Led the development of an AI bartender robot that combines LLM-based interaction with robotic manipulation for drink-serving tasks; implemented arm control, motion planning, and the interaction pipeline.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2023_mule.gif" class="img-fluid rounded z-depth-1" alt="Space Exploration and Development Robot Challenge 2023" avoid_scaling=true %}
  </div>
  <div class="about-entry-body">
    <h3>Space E&D Robot Challenge 2023 <br><strong>1st Place</strong> (Prime Minister's Award, Korea)</h3>
    <p>
      We built and validated a custom rover for a lunar-environment mock mission, where it demonstrated stable mobility over harsh and uneven terrain. I developed the hardware and controller for the rover’s 4-DoF arm, enabling reliable remote operation and successful mineral collection.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2023_baemin_real.gif" class="img-fluid rounded z-depth-1" alt="Baemin Food Delivery Challenge 2023" %}
  </div>
  <div class="about-entry-body">
    <h3>Baemin Food Delivery Challenge 2023 <br><strong>2nd Place</strong> (President's Award, KIRIA)</h3>
    <p>Our team built an autonomous delivery robot that uses IMU feedback to actively stabilize its top platform while navigating uneven terrain and real-world obstacles. I contributed by developing the low-level motor driver interface for the real-robot platform.</p>
  </div>
</div>

## **Publications**

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/throw_in_bucket.jpg" class="img-fluid rounded z-depth-1" alt="Dynamic Scoop-and-Flick Manipulation" %}
  </div>
  <div class="about-entry-body">
    <h3>Dynamic Scoop-and-Flick Manipulation for Rapid Non-Prehensile High-Arc Object Transfer</h3>
    <p><strong>IEEE International Conference on Robotics and Automation (ICRA)</strong><br><strong>G. Ahn</strong>*, J. Lee*, S. Oh, M. Shin, S.-J. Yi, and J. Seo</p>
    <p>
      <a class="btn btn-sm btn-outline-primary" href="/assets/pdf/icra_2026_high_arc_object_transfer.pdf">Paper</a>
      <!-- <a class="btn btn-sm btn-outline-primary" href="https://github.com/JS-RML/Dynamic-Scoop-and-Flick-Manipulation" target="_blank" rel="noopener noreferrer">Code</a> -->
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media about-entry-placeholder" aria-hidden="true"></div>
  <div class="about-entry-body">
    <h3>ANUBIS: A Compact, Low-Cost, Compliant Humanoid Mobile Manipulation Robot</h3>
    <p><strong>IEEE-RAS Humanoids 2025</strong><br>T. Kang, J. Kim, S. Nasrat, D. Song, <strong>G. Ahn</strong>, M. Jo, S. Lee, S.-J. Yi</p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media about-entry-placeholder" aria-hidden="true"></div>
  <div class="about-entry-body">
    <h3>Lucio at RoboCup@Home: An Open-Hardware Mobile Manipulator with Modular Software and On-Device LLM Planning</h3>
    <p>
      <strong>IEEE-RAS Humanoids 2025 (Poster Presentation)</strong><br>D. Song, T. Kang, S. Nasrat, J. Kim, M. Jo,
      <strong>G. Ahn</strong>, S. Lee, S. Yi
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media about-entry-placeholder" aria-hidden="true"></div>
  <div class="about-entry-body">
    <h3>Development of Dual-Arm Human Companion Robots That Can Dance</h3>
    <p><strong>Sensors, 24(20), 6704</strong><br>J. Kim, T. Kang, D. Song, <strong>G. Ahn</strong>, S.-J. Yi</p>
  </div>
</div>

## **Internship**

<div class="about-entry">
  <div class="about-entry-media about-entry-placeholder" aria-hidden="true"></div>
  <div class="about-entry-body">
    <h3>OMRON SINIC X <br>Research Intern (Jul 2026 - Present)</h3>
    <p>
      Developing a hierarchical framework for dynamic collaborative object transfer that combines diffusion models with
      model-based control.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/tommoro.jpg" class="img-fluid rounded z-depth-1" alt="Tomorro Robotics Korea internship" %}
  </div>
  <div class="about-entry-body">
    <h3>Tomorro Robotics <br>Research Intern (Sep 2025 - Jun 2026)</h3>
    <p>
      Contributed to an autonomous mobile manipulator for a dual-robot factory workflow demonstration at CES 2026. I also
      worked on a UMI-inspired manipulation interface, a general-purpose inverse kinematics solver, and a 3D-LiDAR-based
      humanoid navigation system for domestic environments.
    </p>
  </div>
</div>

## **Other Projects**

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/autonomous_navigation.gif" class="img-fluid rounded z-depth-1" alt="Autonomous quadruped patrol navigation" avoid_scaling=true %}
  </div>
  <div class="about-entry-body">
    <h3>Autonomous Quadruped Patrol System</h3>
    <p>
      The system uses an autonomous quadruped platform for safe patrol navigation and anomaly detection in a government
      and National Police Agency related setting. I participated in the perception and hardware integration work, including
      camera mount design and a multi-camera depth pipeline using Intel RealSense D435 cameras.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/teleop3_optimized.gif" class="img-fluid rounded z-depth-1" alt="Mobile dual-arm robot teleoperation for data collection" avoid_scaling=true %}
  </div>
  <div class="about-entry-body">
    <h3>Mobile Dual-Arm Robot System for Scalable Learning Data Collection</h3>
    <p>
      In collaboration with LG Electronics, the platform was designed for scalable bimanual manipulation data collection and
      safe policy rollouts. I participated in the robot hardware and manipulation system development, with a focus on
      lightweight compliant manipulator design.
    </p>
  </div>
</div>

## **Outreach & Service**

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/Geumjeongschool.jpg" class="img-fluid rounded z-depth-1 about-entry-small-square" alt="Geumjeong Lifelong Learning Center volunteer work" %}
  </div>
  <div class="about-entry-body">
    <h3>Geumjeong Lifelong Learning Center <br> Volunteer (Apr 2022 - Jul 2026)</h3>
    <p>
      For over four years, I worked closely with senior learners and supported the center wherever needed, from teaching and
      facility maintenance to building an online platform for program management and daily operations.
    </p>
  </div>
</div>
